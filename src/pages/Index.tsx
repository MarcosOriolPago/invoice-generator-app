import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, Download, ArrowRight } from "lucide-react";

const Index = () => {
  const handleStartCreating = () => {
    window.location.href = '/invoice';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-professional mb-6">
              Professional Invoice Generator
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Create beautiful, professional invoices for your web development services. 
              Generate and download PDF invoices in minutes.
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              onClick={handleStartCreating}
            >
              Start Creating Invoices
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-professional mb-12">
            Everything you need for professional invoicing
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center p-6">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Easy Form Creation</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Simple, intuitive forms designed specifically for web development services. 
                  Add your business info, client details, and services with ease.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                <CardTitle className="text-xl">Professional Design</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Clean, modern invoice templates that look professional and 
                  help you maintain a great impression with your clients.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Download className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Instant PDF Download</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Generate high-quality PDF invoices instantly. Perfect for sending 
                  to clients or keeping for your records.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <Card className="bg-professional text-professional-foreground p-8">
            <CardHeader>
              <CardTitle className="text-2xl mb-4">
                Ready to create your first professional invoice?
              </CardTitle>
              <CardDescription className="text-professional-foreground/80 text-lg mb-6">
                Join thousands of web developers who trust our invoice generator for their business needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-professional hover:bg-white/90 px-8 py-3 text-lg"
                onClick={handleStartCreating}
              >
                Get Started Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;