import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      <div className="w-full max-w-2xl mx-6">
        <Card className="backdrop-blur-sm bg-white/90 border border-gray-200/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="space-y-8">
              {/* Icon and Status */}
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-100 to-red-100">
                  <AlertTriangle className="h-16 w-16 text-orange-600" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-6xl font-bold text-gray-900 tracking-tight">404</h1>
                  <h2 className="text-2xl font-semibold text-gray-800">Page Not Found</h2>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-4">
                <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
                  The page you're looking for doesn't exist or has been moved to a different location.
                </p>
                <p className="text-sm text-gray-500">
                  Let's get you back to managing your risks and projects.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Link to="/">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    <Home className="mr-2 h-4 w-4" />
                    Return to Dashboard
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 rounded-xl transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
