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
import { useTranslation } from "@/lib/i18n";

export default function CloudflareSetupPage() {
  const { t } = useTranslation();

  // Cloudflare Features (translated)
  const CLOUDFLARE_FEATURES = [
    {
      id: "cdn",
      name: t.cloudflare.cdnName,
      description: t.cloudflare.cdnDesc,
      icon: Globe,
      benefits: [t.cloudflare.cdnBenefit1, t.cloudflare.cdnBenefit2, t.cloudflare.cdnBenefit3],
      enabled: true,
    },
    {
      id: "ddos",
      name: t.cloudflare.ddosName,
      description: t.cloudflare.ddosDesc,
      icon: Shield,
      benefits: [t.cloudflare.ddosBenefit1, t.cloudflare.ddosBenefit2, t.cloudflare.ddosBenefit3],
      enabled: true,
    },
    {
      id: "waf",
      name: t.cloudflare.wafName,
      description: t.cloudflare.wafDesc,
      icon: Lock,
      benefits: [t.cloudflare.wafBenefit1, t.cloudflare.wafBenefit2, t.cloudflare.wafBenefit3],
      enabled: false,
    },
    {
      id: "ssl",
      name: t.cloudflare.sslName,
      description: t.cloudflare.sslDesc,
      icon: Lock,
      benefits: [t.cloudflare.sslBenefit1, t.cloudflare.sslBenefit2, t.cloudflare.sslBenefit3],
      enabled: true,
    },
    {
      id: "cache",
      name: t.cloudflare.cacheName,
      description: t.cloudflare.cacheDesc,
      icon: Zap,
      benefits: [t.cloudflare.cacheBenefit1, t.cloudflare.cacheBenefit2, t.cloudflare.cacheBenefit3],
      enabled: true,
    },
    {
      id: "analytics",
      name: t.cloudflare.analyticsName,
      description: t.cloudflare.analyticsDesc,
      icon: BarChart3,
      benefits: [t.cloudflare.analyticsBenefit1, t.cloudflare.analyticsBenefit2, t.cloudflare.analyticsBenefit3],
      enabled: false,
    },
  ];

  // Setup steps (translated)
  const SETUP_STEPS = [
    {
      id: 1,
      title: t.cloudflare.step1Title,
      description: t.cloudflare.step1Desc,
      completed: false,
    },
    {
      id: 2,
      title: t.cloudflare.step2Title,
      description: t.cloudflare.step2Desc,
      completed: false,
    },
    {
      id: 3,
      title: t.cloudflare.step3Title,
      description: t.cloudflare.step3Desc,
      completed: false,
    },
    {
      id: 4,
      title: t.cloudflare.step4Title,
      description: t.cloudflare.step4Desc,
      completed: false,
    },
    {
      id: 5,
      title: t.cloudflare.step5Title,
      description: t.cloudflare.step5Desc,
      completed: false,
    },
  ];
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [config, setConfig] = useState({
    email: "",
    apiKey: "",
    zoneId: "",
    accountId: "",
  });
  const [zoneInfo, setZoneInfo] = useState<{ name?: string; status?: string; plan?: string } | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} ${t.cloudflare.copied}`);
  };

  // Guardar credenciales en .env.local vía API
  const handleSaveCredentials = async () => {
    if (!config.email || !config.apiKey || !config.zoneId) {
      toast.error("Completa email, API Key y Zone ID como mínimo");
      return;
    }
    setIsSaving(true);
    try {
      const vars = [
        { key: "CLOUDFLARE_EMAIL", value: config.email },
        { key: "CLOUDFLARE_API_KEY", value: config.apiKey },
        { key: "CLOUDFLARE_ZONE_ID", value: config.zoneId },
      ];
      if (config.accountId) {
        vars.push({ key: "CLOUDFLARE_ACCOUNT_ID", value: config.accountId });
      }
      for (const v of vars) {
        const res = await fetch("/api/admin/env-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(v),
        });
        if (!res.ok) throw new Error(`Error guardando ${v.key}`);
      }
      toast.success("Credenciales guardadas en .env.local");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar credenciales");
    } finally {
      setIsSaving(false);
    }
  };

  // Test real contra Cloudflare API
  const handleTestConnection = async () => {
    if (!config.apiKey || !config.zoneId) {
      toast.error(t.cloudflare.testError);
      return;
    }

    setIsTesting(true);
    try {
      // Verificar token/key contra Cloudflare API
      const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${config.zoneId}`, {
        headers: {
          "X-Auth-Email": config.email,
          "X-Auth-Key": config.apiKey,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.success && data.result) {
        setIsConnected(true);
        setZoneInfo({
          name: data.result.name,
          status: data.result.status,
          plan: data.result.plan?.name,
        });
        toast.success(`Conectado a ${data.result.name} (${data.result.plan?.name || "Free"})`);
        // Auto-guardar credenciales
        await handleSaveCredentials();
      } else {
        setIsConnected(false);
        toast.error(data.errors?.[0]?.message || "No se pudo verificar la conexión");
      }
    } catch (err: any) {
      setIsConnected(false);
      toast.error("Error de red al conectar con Cloudflare");
    } finally {
      setIsTesting(false);
    }
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
              <h1 className="text-xl sm:text-2xl font-bold">{t.cloudflare.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t.cloudflare.subtitle}
              </p>
            </div>
          </div>
        </div>
        {isConnected ? (
          <Badge className="bg-green-100 text-green-700">
            <Check className="h-3 w-3 mr-1" />
            {t.cloudflare.connected}
          </Badge>
        ) : (
          <Badge variant="secondary">
            {t.cloudflare.notConnected}
          </Badge>
        )}
      </div>

      {/* Info Banner */}
      <Alert className="mb-6 border-orange-200 bg-orange-50">
        <Info className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-800">{t.cloudflare.whyCloudflare}</AlertTitle>
        <AlertDescription className="text-orange-700">
          {t.cloudflare.whyCloudflareDesc}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="setup">{t.cloudflare.setupGuide}</TabsTrigger>
          <TabsTrigger value="config">{t.cloudflare.configuration}</TabsTrigger>
          <TabsTrigger value="features">{t.cloudflare.features}</TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.cloudflare.setupProgress}</CardTitle>
              <CardDescription>{t.cloudflare.completeSteps}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm">
                  <span>{t.cloudflare.stepsCompleted.replace("{completed}", String(completedSteps)).replace("{total}", String(SETUP_STEPS.length))}</span>
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
              <CardTitle className="text-base">{t.cloudflare.quickStartGuide}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 1</Badge>
                      <span>{t.cloudflare.createAccount}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      {t.cloudflare.createAccountDesc}
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>{t.cloudflare.enterEmail}</li>
                      <li>{t.cloudflare.createPassword}</li>
                      <li>{t.cloudflare.verifyEmail}</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 2</Badge>
                      <span>{t.cloudflare.addDomain}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      {t.cloudflare.addDomainDesc}
                    </p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm">yourdomain.com</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t.cloudflare.cloudflareWillScan}
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 3</Badge>
                      <span>{t.cloudflare.updateNameservers}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      {t.cloudflare.updateNameserversDesc}
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
                        {t.cloudflare.dnsPropagation}
                      </AlertDescription>
                    </Alert>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 4</Badge>
                      <span>{t.cloudflare.configureSSL}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>
                      {t.cloudflare.configureSSLDesc}
                    </p>
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Full (Strict)</span>
                        </div>
                        <Badge className="bg-green-100 text-green-700">{t.cloudflare.recommended}</Badge>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Step 5</Badge>
                      <span>{t.cloudflare.enableSecurity}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <p>{t.cloudflare.enableSecurityDesc}</p>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {t.cloudflare.alwaysUseHTTPS}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {t.cloudflare.automaticHTTPS}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {t.cloudflare.browserIntegrityCheck}
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        {t.cloudflare.hotlinkProtection}
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
              <CardTitle className="text-base">{t.cloudflare.apiConfiguration}</CardTitle>
              <CardDescription>
                {t.cloudflare.apiConfigDesc}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.cloudflare.cloudflareEmail}</Label>
                <Input
                  id="email"
                  type="email"
                  value={config.email}
                  onChange={(e) => setConfig({ ...config, email: e.target.value })}
                  placeholder="your-email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">{t.cloudflare.globalApiKey}</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="apiKey"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder={t.cloudflare.enterApiKey}
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
                  {t.cloudflare.findApiKey}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zoneId">{t.cloudflare.zoneId}</Label>
                <Input
                  id="zoneId"
                  value={config.zoneId}
                  onChange={(e) => setConfig({ ...config, zoneId: e.target.value })}
                  placeholder={t.cloudflare.enterZoneId}
                />
                <p className="text-xs text-muted-foreground">
                  {t.cloudflare.findZoneId}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountId">{t.cloudflare.accountId}</Label>
                <Input
                  id="accountId"
                  value={config.accountId}
                  onChange={(e) => setConfig({ ...config, accountId: e.target.value })}
                  placeholder={t.cloudflare.enterAccountId}
                />
              </div>

              <Separator />

              {/* Zone Info */}
              {zoneInfo && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-1">
                  <p className="font-medium text-green-800">Dominio: {zoneInfo.name}</p>
                  <p className="text-sm text-green-700">Estado: {zoneInfo.status} | Plan: {zoneInfo.plan}</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t.cloudflare.connectionStatus}</p>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? t.cloudflare.connectedToCloudflare : t.cloudflare.notConnectedStatus}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveCredentials}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Settings2 className="h-4 w-4 mr-2" />
                    )}
                    Guardar
                  </Button>
                  <Button
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {t.cloudflare.testConnection}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Environment Variables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t.cloudflare.environmentVariables}</CardTitle>
              <CardDescription>{t.cloudflare.addToEnv}</CardDescription>
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
          <CardTitle className="text-base">{t.cloudflare.helpfulResources}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: t.cloudflare.cloudflareDocs, url: "https://developers.cloudflare.com" },
              { name: t.cloudflare.dnsSetupGuide, url: "https://developers.cloudflare.com/dns" },
              { name: t.cloudflare.sslGuide, url: "https://developers.cloudflare.com/ssl" },
              { name: t.cloudflare.securityBestPractices, url: "https://developers.cloudflare.com/fundamentals/security" },
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
