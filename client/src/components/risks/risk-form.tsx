import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RISK_CATEGORIES, RISK_STATUS } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bot } from "lucide-react";

// Form schema based on risk model
const riskFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum(RISK_CATEGORIES as [string, ...string[]]),
  probability: z.coerce.number().int().min(1).max(5),
  impact: z.coerce.number().int().min(1).max(5),
  status: z.enum(RISK_STATUS as [string, ...string[]]),
  mitigation_plan: z.string().optional(),
  owner_id: z.number().nullable().optional(),
  project_id: z.number().nullable().optional(),
});

type RiskFormValues = z.infer<typeof riskFormSchema>;

interface RiskFormProps {
  risk?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RiskForm({ risk, onSuccess, onCancel }: RiskFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingMitigation, setIsGeneratingMitigation] = useState(false);

  // Fetch users for owner assignment
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch projects for project assignment
  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Default values for the form
  const defaultValues: Partial<RiskFormValues> = {
    title: risk?.title || "",
    description: risk?.description || "",
    category: risk?.category || "Operational",
    probability: risk?.probability || 3,
    impact: risk?.impact || 3,
    status: risk?.status || "Identified",
    mitigation_plan: risk?.mitigation_plan || "",
    owner_id: risk?.owner_id || null,
    project_id: risk?.project_id || null,
  };

  // Initialize form
  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskFormSchema),
    defaultValues,
  });

  // Create or update risk mutation
  const mutation = useMutation({
    mutationFn: async (data: RiskFormValues) => {
      if (risk) {
        // Update existing risk
        const response = await apiRequest("PUT", `/api/risks/${risk.id}`, data);
        return response.json();
      } else {
        // Create new risk
        const response = await apiRequest("POST", "/api/risks", data);
        return response.json();
      }
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      
      toast({
        title: risk ? "Risk Updated" : "Risk Created",
        description: risk 
          ? `Risk ${risk.reference_id} has been updated successfully.`
          : "New risk has been created successfully.",
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${risk ? "update" : "create"} risk: ${error.message}`,
      });
    },
  });

  // Generate mitigation plan with AI
  const generateMitigationPlan = async () => {
    const formValues = form.getValues();
    
    // Check if required fields are filled
    if (!formValues.title || !formValues.description || !formValues.category) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide risk title, description, and category to generate a mitigation plan.",
      });
      return;
    }
    
    setIsGeneratingMitigation(true);
    
    try {
      const response = await apiRequest("POST", "/api/ai/mitigation-plan", {
        risk: {
          title: formValues.title,
          description: formValues.description,
          category: formValues.category,
          probability: formValues.probability,
          impact: formValues.impact,
        },
      });
      
      const data = await response.json();
      
      if (data.mitigationPlan) {
        form.setValue("mitigation_plan", data.mitigationPlan);
        toast({
          title: "AI Mitigation Plan Generated",
          description: "A mitigation plan has been generated based on the risk details.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate mitigation plan. Please try again.",
      });
    } finally {
      setIsGeneratingMitigation(false);
    }
  };

  // Form submission handler
  const onSubmit = (data: RiskFormValues) => {
    mutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Risk Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter a descriptive title for the risk" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RISK_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="owner_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Owner</FormLabel>
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => 
                    field.onChange(value ? parseInt(value, 10) : null)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign an owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select probability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Very Low (1)</SelectItem>
                    <SelectItem value="2">Low (2)</SelectItem>
                    <SelectItem value="3">Medium (3)</SelectItem>
                    <SelectItem value="4">High (4)</SelectItem>
                    <SelectItem value="5">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="impact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impact</FormLabel>
                <Select
                  value={field.value.toString()}
                  onValueChange={(value) => field.onChange(parseInt(value, 10))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Very Low (1)</SelectItem>
                    <SelectItem value="2">Low (2)</SelectItem>
                    <SelectItem value="3">Medium (3)</SelectItem>
                    <SelectItem value="4">High (4)</SelectItem>
                    <SelectItem value="5">Very High (5)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => 
                    field.onChange(value ? parseInt(value, 10) : null)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RISK_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the risk in detail" 
                  className="min-h-24"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="mitigation_plan"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mitigation Plan</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the plan to mitigate this risk" 
                  className="min-h-24"
                  {...field} 
                />
              </FormControl>
              <div className="mt-2 text-right">
                <Button
                  type="button"
                  variant="outline"
                  className="inline-flex items-center"
                  onClick={generateMitigationPlan}
                  disabled={isGeneratingMitigation}
                >
                  <Bot className="mr-2 h-4 w-4" />
                  {isGeneratingMitigation ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {mutation.isPending
              ? risk
                ? "Updating..."
                : "Creating..."
              : risk
                ? "Update Risk"
                : "Save Risk"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
