import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getColorBySeverity, getColorByCategory } from "@/lib/utils";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, Check, Bot, Save, Sparkles } from "lucide-react";

// Form schema for risk generation
const aiGeneratorSchema = z.object({
  projectDescription: z
    .string()
    .min(20, "Project description must be at least 20 characters"),
  industry: z.string().optional(),
});

type AIGeneratorFormValues = z.infer<typeof aiGeneratorSchema>;

export function AIGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedRisks, setGeneratedRisks] = useState<any[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<number[]>([]);

  // Initialize form
  const form = useForm<AIGeneratorFormValues>({
    resolver: zodResolver(aiGeneratorSchema),
    defaultValues: {
      projectDescription: "",
      industry: "",
    },
  });

  // Generate risks mutation
  const generateMutation = useMutation({
    mutationFn: async (data: AIGeneratorFormValues) => {
      const response = await apiRequest("POST", "/api/ai/risk-suggestions", data);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedRisks(data);
      toast({
        title: "Risks Generated",
        description: `${data.length} potential risks have been identified.`,
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: `Failed to generate risks: ${error.message}`,
      });
    },
  });

  // Save selected risks mutation
  const saveRisksMutation = useMutation({
    mutationFn: async (risks: any[]) => {
      const promises = risks.map((risk) =>
        apiRequest("POST", "/api/risks", risk)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Risks Saved",
        description: `${selectedRisks.length} risks have been added to your risk register.`,
      });
      setSelectedRisks([]);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: `Failed to save risks: ${error.message}`,
      });
    },
  });

  // Form submission handler
  const onSubmit = (data: AIGeneratorFormValues) => {
    generateMutation.mutate(data);
  };

  // Toggle risk selection
  const toggleRiskSelection = (index: number) => {
    setSelectedRisks((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Save selected risks
  const saveSelectedRisks = () => {
    if (selectedRisks.length === 0) {
      toast({
        variant: "destructive",
        title: "No Risks Selected",
        description: "Please select at least one risk to save.",
      });
      return;
    }

    const risksToSave = selectedRisks.map((index) => generatedRisks[index]);
    saveRisksMutation.mutate(risksToSave);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Risk Generator</CardTitle>
          <CardDescription>
            Generate potential risks based on your project description using AI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="projectDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project in detail, including scope, objectives, timeline, and any known challenges..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Healthcare, Finance, Technology, Construction..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <>
                    <Bot className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Generate Risks
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {generatedRisks.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Generated Risks</CardTitle>
              <CardDescription>
                Select the risks you want to add to your risk register
              </CardDescription>
            </div>
            <Button
              onClick={saveSelectedRisks}
              disabled={
                selectedRisks.length === 0 || saveRisksMutation.isPending
              }
              className="bg-green-600 hover:bg-green-700"
            >
              {saveRisksMutation.isPending ? (
                <>
                  <Save className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Selected ({selectedRisks.length})
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6">
              {generatedRisks.map((risk, index) => {
                const isSelected = selectedRisks.includes(index);
                const { bg: categoryBg, text: categoryText } = getColorByCategory(
                  risk.category
                );
                const severity = calculateSeverity(
                  risk.probability,
                  risk.impact
                );
                const { bg: severityBg, text: severityText } = getColorBySeverity(
                  severity
                );

                return (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 transition-colors ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {isSelected ? (
                          <Check className="h-5 w-5 text-blue-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>
                      <div className="ml-3 flex-grow">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-900">
                            {risk.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryBg} ${categoryText}`}
                            >
                              {risk.category}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${severityBg} ${severityText}`}
                            >
                              {severity} (P{risk.probability}, I{risk.impact})
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">
                          {risk.description}
                        </p>
                        <div className="mt-3 bg-gray-50 p-3 rounded">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center">
                            <Sparkles className="h-4 w-4 mr-1 text-purple-500" />
                            AI-Generated Mitigation Plan
                          </h4>
                          <p className="mt-1 text-sm text-gray-600">
                            {risk.mitigation_plan}
                          </p>
                        </div>
                        <div className="mt-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRiskSelection(index)}
                          >
                            {isSelected ? "Deselect" : "Select"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to calculate severity based on probability and impact
function calculateSeverity(probability: number, impact: number): string {
  const score = probability * impact;
  if (score >= 20) return "Critical";
  if (score >= 12) return "High";
  if (score >= 6) return "Medium";
  if (score >= 3) return "Low";
  return "Very Low";
}
