"use client";

/**
 * CAARD - Cloudflare Integration Setup
 * =====================================
 * Configuration page for Cloudflare CDN, security, and performance features
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Cloud,
  Shield,
  Zap,
  Globe,
  Lock,
  Server,
  BarChart3,
  Settings2,
  Check,
  Copy,
  ExternalLink,
  AlertTriangle,
  Info,
  ChevronRight,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Cloudflare Features
const CLOUDFLARE_FEATURES = [
  {
    id: "cdn",
    name: "CDN (Content Delivery Network)",
    description: "Distribute content globally for faster load times",
    icon: Globe,
    benefits: ["Faster page loads", "Reduced server load", "Global coverage"],
    enabled: true,
  },
  {
    id: "ddos",
    name: "DDoS Protection",
    description: "Protect against distributed denial-of-service attacks",
    icon: Shield,
    benefits: ["24/7 protection", "Automatic mitigation", "No extra cost"],
    enabled: true,
  },
  {
    id: "waf",
    name: "Web Application Firewall",
    description: "Block common web vulnerabilities and attacks",
    icon: Lock,
    benefits: ["SQL injection protection", "XSS prevention", "Bot mitigation"],
    enabled: false,
  },
  {
    id: "ssl",
    name: "SSL/TLS Encryption",
    description: "Secure connections with HTTPS",
    icon: Lock,
    benefits: ["Free SSL certificate", "Automatic renewal", "Full encryption"],
    enabled: true,
  },
  {
    id: "cache",
    name: "Intelligent Caching",
    description: "Cache static assets for improved performance",
    icon: Zap,
    benefits: ["Reduced bandwidth", "Faster responses", "Lower costs"],
    enabled: true,
  },
  {
    id: "analytics",
    name: "Web Analytics",
    description: "Traffic and security insights",
    icon: BarChart3,
    benefits: ["Real-time data", "Threat analytics", "Performance metrics"],
    enabled: false,
  },
];

// Setup steps
const SETUP_STEPS = [
  {
    id: 1,
    title: "Create Cloudflare Account",
    description: "Sign up for a free Cloudflare account",
    completed: false,
  },
  {
    id: 2,
    title: "Add Your Domain",
    description: "Add your domain to Cloudflare",
    completed: false,
  },
  {
    id: 3,
    title: "Update DNS Nameservers",
    description: "Point your domain to Cloudflare nameservers",
    completed: false,
  },
  {
    id: 4,
    title: "Configure SSL Mode",
    description: "Set SSL/TLS encryption mode to Full (Strict)",
    completed: false,
  },
  {
    id: 5,
    title: "Enable Page Rules",
    description: "Configure caching and security rules",
    completed: false,
  },
];

export default function CloudflareSetupPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState({
    email: "",
    apiKey: "",
    zoneId: "",
    accountId: "",
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleTestConnection = async () => {
    if (!config.apiKey || !config.zoneId) {
      toast.error("Please enter API credentials first");
      return;
    }

    setIsTesting(true);
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsConnected(true);
    setIsTesting(false);
    toast.success("Successfully connected to Cloudflare!");
  };

  const completedSteps = SETUP_STEPS.filter((s) => s.completed).length;
  const progressPercent = (completedSteps / SETUP_STEPS.length) * 100;

  return (
    <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Cloud className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">Cloudflare Integration</h1>
              <p className="text-sm text-muted-foreground">
                CDN, Security, and Performance
              </p>
            </div>
          </div>
        </div>
        {isConnected ? (
          <Badge className="bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        ) : (
          <Badge variant="secondary">
            Not Connected
          </Badge>
        )}
      </div>

      {/* Info Banner */}
      <Alert className="mb-6 border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">Why Cloudflare?</AlertTitle>
        <AlertDescription className="text-orange-700">
          Cloudflare provides free CDN, DDoS protection, SSL certificates, and web security for your site.
          It can significantly improve performance and protect against attacks.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Setup Progress</CardTitle>
              <CardDescription>Complete these steps to integrate Cloudflare</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>{completedSteps} of {SETUP_STEPS.length} steps completed</span>
                  <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>

              <div className="space-y-4">
                {SETUP_STEPS.map((step, index) => (
                  <div
                    key={step.id}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border",
                      step.completed ? "bg-green-50 border-green-200" : "bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step.completed
                        ? "bg-green-100 text-green-700"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {step.completed ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                    {index === 0 && !step.completed && (
                      <Button size="sm" asChild>
                        <a
                          href="https://dash.cloudflare.com/sign-up"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Sign Up
                          <ExternalLink className="h-3 w-3 ml-1" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Start Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Start Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 1</Badge>
                      <span>Create a Cloudflare Account</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      Visit <a href="https://dash.cloudflare.com/sign-up" target="_blank" rel="noopener noreferrer" className="text-[#D66829] underline">dash.cloudflare.com/sign-up</a> to create a free account.
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Enter your email address</li>
                      <li>Create a strong password</li>
                      <li>Verify your email</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 2</Badge>
                      <span>Add Your Domain</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      In the Cloudflare dashboard, click &quot;Add a Site&quot; and enter your domain name.
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">yourdomain.com</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Cloudflare will scan your existing DNS records automatically.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 3</Badge>
                      <span>Update DNS Nameservers</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      Update your domain&apos;s nameservers at your registrar to point to Cloudflare:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <code className="font-mono text-sm">ns1.cloudflare.com</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy("ns1.cloudflare.com", "Nameserver 1")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <code className="font-mono text-sm">ns2.cloudflare.com</code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy("ns2.cloudflare.com", "Nameserver 2")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        DNS propagation can take up to 48 hours. Most changes take effect within a few hours.
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 4</Badge>
                      <span>Configure SSL/TLS</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      In Cloudflare, go to SSL/TLS settings and set encryption mode to <strong>Full (Strict)</strong>.
                    </p>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Full (Strict)</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Recommended</Badge>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 5</Badge>
                      <span>Enable Security Features</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>Enable these recommended security settings:</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Always Use HTTPS
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Automatic HTTPS Rewrites
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Browser Integrity Check
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Hotlink Protection
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">API Configuration</CardTitle>
              <CardDescription>
                Connect CAARD to Cloudflare using your API credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Cloudflare Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="your-email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">Global API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder="Enter your Cloudflare API key"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Find this in Cloudflare under My Profile → API Tokens → Global API Key
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoneId">Zone ID</Label>
                <Input
                  id="zoneId"
                  value={config.zoneId}
                  onChange={(e) => setConfig({ ...config, zoneId: e.target.value })}
                  placeholder="Enter your Zone ID"
                />
                <p className="text-xs text-muted-foreground">
                  Found in Cloudflare dashboard → Overview → API section
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId">Account ID (Optional)</Label>
                <Input
                  id="accountId"
                  value={config.accountId}
                  onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                  placeholder="Enter your Account ID"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Connection Status</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? "Connected to Cloudflare" : "Not connected"}
                  </p>
                </div>
                <Button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Environment Variables</CardTitle>
              <CardDescription>Add these to your .env file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: "CLOUDFLARE_EMAIL", value: config.email || "your-email@example.com" },
                  { name: "CLOUDFLARE_API_KEY", value: config.apiKey ? "***hidden***" : "your-api-key" },
                  { name: "CLOUDFLARE_ZONE_ID", value: config.zoneId || "your-zone-id" },
                ].map((env) => (
                  <div
                    key={env.name}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg font-mono text-sm"
                  >
                    <span>{env.name}={env.value}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(`${env.name}=${env.value}`, env.name)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {CLOUDFLARE_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-orange-100">
                          <Icon className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{feature.name}</CardTitle>
                          <CardDescription className="text-xs">{feature.description}</CardDescription>
                        </div>
                      </div>
                      <Switch checked={feature.enabled} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {feature.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3 w-3 text-green-600" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Resources */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: "Cloudflare Docs", url: "https://developers.cloudflare.com" },
              { name: "DNS Setup Guide", url: "https://developers.cloudflare.com/dns" },
              { name: "SSL/TLS Guide", url: "https://developers.cloudflare.com/ssl" },
              { name: "Security Best Practices", url: "https://developers.cloudflare.com/fundamentals/security" },
            ].map((resource) => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{resource.name}</span>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
