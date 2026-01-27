"use client";

/**
 * CAARD - Sidebar Principal del Sistema
 * ======================================
 * Navegación completa organizada por:
 * 1. Mi Espacio (Dashboard por rol)
 * 2. Expedientes y Gestión
 * 3. Secretaría (admin)
 * 4. Administración (admin)
 * 5. Sitio Web / CMS (admin)
 * 6. Inteligencia Artificial (admin)
 *
 * Características:
 * - Colapso automático por sección
 * - Solo la sección activa se expande
 * - Navegación por roles
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  FileText,
  Folder,
  CreditCard,
  Bell,
  Settings,
  Users,
  Building2,
  Scale,
  LogOut,
  ChevronDown,
  Globe,
  FileEdit,
  Calendar,
  Megaphone,
  Inbox,
  Newspaper,
  Shield,
  Bot,
  Cpu,
  BarChart3,
  Link2,
  ChevronsLeft,
  ChevronsRight,
  ChevronRight,
  Gavel,
  Clock,
  Zap,
  DollarSign,
  UserCheck,
  AlertTriangle,
  FolderOpen,
  Upload,
  MessageSquare,
  ClipboardList,
  UserCircle,
  Briefcase,
  Home,
  FilePlus,
  Search,
  History,
  Receipt,
  BadgeCheck,
  Ban,
  Database,
  Cog,
  PieChart,
  Activity,
  HelpCircle,
  Wallet,
  Calculator,
  Banknote,
  FileCheck,
  Percent,
  UsersRound,
  Quote,
  Image,
  MapPin,
  Wrench,
  BookOpen,
  HelpCircle as HelpCircleIcon,
  FileQuestion,
  Mail,
  BellRing,
  HeartPulse,
  Cloud,
  Server,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { signOut, useSession } from "next-auth/react";
import { getInitials } from "@/lib/utils";
import { ROLE_LABELS } from "@/types";
import { useTranslation } from "@/lib/i18n";

// Tipo para items de navegación
interface NavItem {
  title: string;
  href: string;
  icon: any;
  roles: string[];
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  children?: NavItem[];
}

// Tipo para secciones de navegación
interface NavSection {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
  showForRoles?: string[];
  dividerBefore?: boolean;
}

// =============================================
// FUNCIÓN PARA GENERAR ITEMS CON TRADUCCIONES
// =============================================
function useNavigationItems() {
  const { t } = useTranslation();

  // MI ESPACIO - Dashboard según rol
  const mySpaceItems: NavItem[] = [
    {
      title: t.sidebar.myDashboard,
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.secretaryPanel,
      href: "/secretaria",
      icon: ClipboardList,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.arbitratorPanel,
      href: "/arbitro",
      icon: Gavel,
      roles: ["SUPER_ADMIN", "ADMIN", "ARBITRO"],
    },
    {
      title: t.sidebar.lawyerPanel,
      href: "/abogado",
      icon: Briefcase,
      roles: ["SUPER_ADMIN", "ADMIN", "ABOGADO"],
    },
    {
      title: t.sidebar.staffPanel,
      href: "/staff",
      icon: UserCheck,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.myCase,
      href: "/parte",
      icon: UserCircle,
      roles: ["DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.aiAssistant,
      href: "/asistente",
      icon: MessageSquare,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
  ];

  // EXPEDIENTES - Gestión de casos
  const casesItems: NavItem[] = [
    {
      title: t.sidebar.allCases,
      href: "/cases",
      icon: FileText,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO"],
    },
    {
      title: t.sidebar.newCase,
      href: "/cases/new",
      icon: FilePlus,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.searchCase,
      href: "/cases/search",
      icon: Search,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO"],
    },
    {
      title: t.sidebar.myCases,
      href: "/cases/mine",
      icon: FolderOpen,
      roles: ["ARBITRO", "ABOGADO"],
    },
  ];

  // GESTIÓN PROCESAL - Secretaría
  const procesalItems: NavItem[] = [
    {
      title: t.sidebar.pendingRequests,
      href: "/secretaria/solicitudes",
      icon: Inbox,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
      badge: "Nuevo",
      badgeVariant: "destructive",
    },
    {
      title: t.sidebar.deadlines,
      href: "/secretaria/plazos",
      icon: Clock,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.emergencies,
      href: "/secretaria/emergencias",
      icon: Zap,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.arbitrators,
      href: "/secretaria/arbitros",
      icon: Gavel,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
      children: [
        {
          title: t.sidebar.arbitratorRegistry,
          href: "/secretaria/arbitros",
          icon: UserCheck,
          roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
        },
        {
          title: t.sidebar.challenges,
          href: "/secretaria/arbitros/recusaciones",
          icon: Ban,
          roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
        },
        {
          title: t.sidebar.sanctions,
          href: "/secretaria/arbitros/sanciones",
          icon: AlertTriangle,
          roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
        },
      ],
    },
  ];

  // DOCUMENTOS
  const documentsItems: NavItem[] = [
    {
      title: t.sidebar.documents,
      href: "/documents",
      icon: Folder,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.uploadDocument,
      href: "/documents/upload",
      icon: Upload,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
  ];

  // FINANZAS - Módulo completo de gestión financiera
  const financeItems: NavItem[] = [
    {
      title: t.sidebar.liquidations,
      href: "/admin/finanzas/liquidaciones",
      icon: Calculator,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.paymentManagement,
      href: "/admin/pagos",
      icon: CreditCard,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.newPaymentOrder,
      href: "/admin/pagos/nueva-orden",
      icon: Receipt,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.paymentConfirmations,
      href: "/admin/pagos/confirmaciones",
      icon: FileCheck,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.arbitratorPayments,
      href: "/admin/pagos/arbitros",
      icon: Banknote,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.installmentPlans,
      href: "/admin/pagos/fraccionamientos",
      icon: Wallet,
      roles: ["SUPER_ADMIN", "ADMIN", "SECRETARIA"],
    },
    {
      title: t.sidebar.taxConfiguration,
      href: "/admin/configuracion/impuestos",
      icon: Percent,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.myPayments,
      href: "/payments",
      icon: CreditCard,
      roles: ["DEMANDANTE", "DEMANDADO"],
    },
  ];

  // NOTIFICACIONES
  const notificationsItems: NavItem[] = [
    {
      title: t.sidebar.allNotifications,
      href: "/notifications",
      icon: Bell,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.history,
      href: "/notifications/history",
      icon: History,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"],
    },
    {
      title: t.sidebar.notificationTemplates,
      href: "/admin/notification-templates",
      icon: Mail,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.notificationSettings,
      href: "/admin/notification-settings",
      icon: BellRing,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
  ];

  // CMS / SITIO WEB
  const cmsItems: NavItem[] = [
    {
      title: t.sidebar.cmsPanel,
      href: "/admin/cms",
      icon: Globe,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.pages,
      href: "/admin/cms/pages",
      icon: FileEdit,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.navigationMenu,
      href: "/admin/cms/menu",
      icon: FileText,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    // El Centro - Submenu
    {
      title: t.sidebar.theCenter || "El Centro",
      href: "/admin/cms/center",
      icon: Building2,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
      children: [
        {
          title: t.sidebar.team,
          href: "/admin/cms/team",
          icon: UsersRound,
          roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
        },
        {
          title: t.sidebar.arbitratorRegistry || "Registro de Árbitros",
          href: "/admin/cms/arbitrators",
          icon: Gavel,
          roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
        },
        {
          title: t.sidebar.locations,
          href: "/admin/cms/locations",
          icon: MapPin,
          roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
        },
        {
          title: t.sidebar.regulations,
          href: "/admin/cms/regulations",
          icon: BookOpen,
          roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
        },
      ],
    },
    {
      title: t.sidebar.articlesBlog,
      href: "/admin/cms/articles",
      icon: Newspaper,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.events,
      href: "/admin/cms/events",
      icon: Calendar,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.announcements,
      href: "/admin/cms/announcements",
      icon: Megaphone,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.testimonials,
      href: "/admin/cms/testimonials",
      icon: Quote,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.services,
      href: "/admin/cms/services",
      icon: Wrench,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.faqs,
      href: "/admin/cms/faqs",
      icon: FileQuestion,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.mediaFiles,
      href: "/admin/cms/media",
      icon: Image,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.configuration,
      href: "/admin/cms/config",
      icon: Settings,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"],
    },
    {
      title: t.sidebar.translations,
      href: "/admin/cms/translations",
      icon: Globe,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // ADMINISTRACIÓN DEL SISTEMA
  const adminItems: NavItem[] = [
    {
      title: t.sidebar.users,
      href: "/admin/users",
      icon: Users,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.rolesPermissions,
      href: "/admin/roles",
      icon: Shield,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.centers,
      href: "/admin/centers",
      icon: Building2,
      roles: ["SUPER_ADMIN"],
    },
    {
      title: t.sidebar.arbitrationTypes,
      href: "/admin/arbitration-types",
      icon: Scale,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.feesRates,
      href: "/admin/fees",
      icon: DollarSign,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.holidays,
      href: "/admin/holidays",
      icon: Calendar,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.systemRules,
      href: "/admin/rules",
      icon: Cog,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.integrations,
      href: "/admin/integrations",
      icon: Link2,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.cloudflare || "Cloudflare",
      href: "/admin/settings/cloudflare",
      icon: Cloud,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.dataMigration,
      href: "/admin/migration",
      icon: Database,
      roles: ["SUPER_ADMIN"],
    },
  ];

  // INTELIGENCIA ARTIFICIAL
  const aiItems: NavItem[] = [
    {
      title: t.sidebar.aiModels,
      href: "/admin/ai/models",
      icon: Cpu,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.assistants,
      href: "/admin/ai/assistants",
      icon: Bot,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.roleConfig,
      href: "/admin/ai/roles",
      icon: Shield,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.quotasLimits,
      href: "/admin/ai/quotas",
      icon: BarChart3,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.usageConsumption,
      href: "/admin/ai/usage",
      icon: Activity,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // REPORTES
  const reportItems: NavItem[] = [
    {
      title: t.sidebar.analyticsDashboard,
      href: "/admin/reports",
      icon: PieChart,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.casesReport,
      href: "/admin/reports/cases",
      icon: FileText,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.paymentsReport,
      href: "/admin/reports/payments",
      icon: DollarSign,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.audit,
      href: "/admin/reports/audit",
      icon: History,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
    {
      title: t.sidebar.siteHealth || "Site Health",
      href: "/admin/reports/site-health",
      icon: HeartPulse,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // CONFIGURACIÓN PERSONAL
  const settingsItems: NavItem[] = [
    {
      title: t.sidebar.myProfile,
      href: "/settings/profile",
      icon: UserCircle,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.security,
      href: "/settings/security",
      icon: Shield,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.notifications,
      href: "/settings/notifications",
      icon: Bell,
      roles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA", "ARBITRO", "ABOGADO", "DEMANDANTE", "DEMANDADO"],
    },
    {
      title: t.sidebar.generalSettings,
      href: "/settings",
      icon: Settings,
      roles: ["SUPER_ADMIN", "ADMIN"],
    },
  ];

  // TODAS LAS SECCIONES
  const ALL_SECTIONS: NavSection[] = [
    { id: "my-space", label: t.sidebar.mySpace, icon: Home, items: mySpaceItems },
    { id: "cases", label: t.sidebar.cases, icon: FileText, items: casesItems },
    { id: "procesal", label: t.sidebar.procesal, icon: ClipboardList, items: procesalItems, showForRoles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF", "SECRETARIA"] },
    { id: "documents", label: t.sidebar.documents, icon: Folder, items: documentsItems },
    { id: "finance", label: t.sidebar.finance, icon: Wallet, items: financeItems },
    { id: "notifications", label: t.sidebar.notifications, icon: Bell, items: notificationsItems },
    { id: "cms", label: t.sidebar.website, icon: Globe, items: cmsItems, showForRoles: ["SUPER_ADMIN", "ADMIN", "CENTER_STAFF"], dividerBefore: true },
    { id: "reports", label: t.sidebar.reports, icon: PieChart, items: reportItems, showForRoles: ["SUPER_ADMIN", "ADMIN"] },
    { id: "admin", label: t.sidebar.admin, icon: Settings, items: adminItems, showForRoles: ["SUPER_ADMIN", "ADMIN"] },
    { id: "ai", label: t.sidebar.ai, icon: Bot, items: aiItems, showForRoles: ["SUPER_ADMIN", "ADMIN"] },
    { id: "settings", label: t.sidebar.settings, icon: Cog, items: settingsItems },
  ];

  return { ALL_SECTIONS, t };
}

// =============================================
// HELPER: Verificar si una ruta está activa
// =============================================
function isItemActive(pathname: string, itemHref: string): boolean {
  return pathname === itemHref || pathname.startsWith(`${itemHref}/`);
}

function isItemOrChildrenActive(pathname: string, item: NavItem): boolean {
  if (isItemActive(pathname, item.href)) return true;
  if (item.children) {
    return item.children.some((child) => isItemActive(pathname, child.href));
  }
  return false;
}

function isSectionActive(pathname: string, items: NavItem[]): boolean {
  return items.some((item) => isItemOrChildrenActive(pathname, item));
}

// =============================================
// COMPONENTE DE SECCIÓN DE NAVEGACIÓN
// =============================================
function NavSection({
  section,
  userRole,
  pathname,
  isOpen,
  onToggle,
}: {
  section: NavSection;
  userRole: string;
  pathname: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Filtrar items por rol
  const filteredItems = section.items.filter((item) => item.roles.includes(userRole));

  if (filteredItems.length === 0) return null;

  const sectionIsActive = isSectionActive(pathname, filteredItems);
  const GroupIcon = section.icon;

  // Si el sidebar está colapsado, mostrar solo iconos con tooltips
  if (isCollapsed) {
    return (
      <SidebarGroup className="py-1">
        <SidebarGroupContent>
          <SidebarMenu>
            {filteredItems.slice(0, 3).map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isItemActive(pathname, item.href)}
                  tooltip={item.title}
                >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  // Sidebar expandido con colapso automático
  return (
    <>
      {section.dividerBefore && (
        <div className="px-3 py-2">
          <div className="border-t border-sidebar-border" />
        </div>
      )}
      <Collapsible open={isOpen} onOpenChange={onToggle} className="group/collapsible">
        <SidebarGroup className="py-0">
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel
              className={cn(
                "cursor-pointer hover:bg-sidebar-accent rounded-md transition-colors px-2 py-1.5",
                sectionIsActive && !isOpen && "bg-sidebar-accent/50"
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <GroupIcon className={cn(
                  "h-4 w-4",
                  sectionIsActive ? "text-primary" : "text-muted-foreground"
                )} />
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  sectionIsActive && "text-primary"
                )}>
                  {section.label}
                </span>
                {sectionIsActive && !isOpen && (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary ml-1" />
                )}
              </div>
              <ChevronRight className={cn(
                "h-3 w-3 transition-transform duration-200",
                isOpen && "rotate-90"
              )} />
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent className="animate-in slide-in-from-top-1 duration-200">
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredItems.map((item) => {
                  const itemIsActive = isItemActive(pathname, item.href);
                  const hasChildren = item.children && item.children.length > 0;
                  const filteredChildren = item.children?.filter((child) =>
                    child.roles.includes(userRole)
                  );
                  const childIsActive = filteredChildren?.some((child) =>
                    isItemActive(pathname, child.href)
                  );

                  if (hasChildren && filteredChildren && filteredChildren.length > 0) {
                    return (
                      <Collapsible
                        key={item.href}
                        defaultOpen={itemIsActive || childIsActive}
                        className="group/submenu"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton isActive={itemIsActive || childIsActive}>
                              <item.icon className="h-4 w-4" />
                              <span className="flex-1">{item.title}</span>
                              {item.badge && (
                                <Badge
                                  variant={item.badgeVariant || "secondary"}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                              <ChevronRight className="h-3 w-3 transition-transform duration-200 group-data-[state=open]/submenu:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {filteredChildren.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isItemActive(pathname, child.href)}
                                  >
                                    <Link href={child.href}>
                                      <child.icon className="h-3 w-3" />
                                      <span>{child.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={itemIsActive}>
                        <Link href={item.href}>
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">{item.title}</span>
                          {item.badge && (
                            <Badge
                              variant={item.badgeVariant || "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>
    </>
  );
}

// =============================================
// BOTÓN TOGGLE SIDEBAR
// =============================================
function SidebarToggleButton() {
  const { state, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={toggleSidebar}
      title={isCollapsed ? `${t.sidebar.expand} (Ctrl+B)` : `${t.sidebar.collapse} (Ctrl+B)`}
    >
      {isCollapsed ? (
        <ChevronsRight className="h-4 w-4" />
      ) : (
        <ChevronsLeft className="h-4 w-4" />
      )}
    </Button>
  );
}

// =============================================
// COMPONENTE PRINCIPAL SIDEBAR
// =============================================
export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { state } = useSidebar();
  const { ALL_SECTIONS, t } = useNavigationItems();
  const userRole = ((session?.user as any)?.role || "DEMANDANTE") as keyof typeof ROLE_LABELS;
  const isCollapsed = state === "collapsed";

  // Filtrar secciones visibles para el rol del usuario
  const visibleSections = useMemo(() => {
    return ALL_SECTIONS.filter((section) => {
      // Si no hay restricción de roles, mostrar para todos
      if (!section.showForRoles) return true;
      // Si hay restricción, verificar que el usuario tenga el rol
      return section.showForRoles.includes(userRole);
    });
  }, [userRole]);

  // Determinar qué sección está activa basándose en el pathname
  const activeSectionId = useMemo(() => {
    for (const section of visibleSections) {
      const filteredItems = section.items.filter((item) => item.roles.includes(userRole));
      if (isSectionActive(pathname, filteredItems)) {
        return section.id;
      }
    }
    return "my-space"; // Default
  }, [pathname, visibleSections, userRole]);

  // Estado de secciones abiertas - solo la activa por defecto
  const [openSections, setOpenSections] = useState<Set<string>>(new Set([activeSectionId]));

  // Actualizar secciones abiertas cuando cambia la ruta
  useEffect(() => {
    // Automáticamente expandir la sección activa y contraer las demás
    setOpenSections(new Set([activeSectionId]));
  }, [activeSectionId]);

  // Función para toggle manual de una sección
  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        // Si está abierta, cerrarla (a menos que sea la activa)
        newSet.delete(sectionId);
      } else {
        // Si está cerrada, abrirla y cerrar las demás (comportamiento acordeón)
        newSet.clear();
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Determinar si el usuario es admin
  const isAdmin = ["SUPER_ADMIN", "ADMIN"].includes(userRole);

  return (
    <Sidebar collapsible="icon">
      {/* Header con logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-2">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scale className="h-4 w-4" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-sidebar-foreground truncate">
                  CAARD
                </span>
                <span className="text-[10px] text-sidebar-foreground/60 truncate">
                  {t.sidebar.arbitrationCenter}
                </span>
              </div>
            )}
          </Link>
          <SidebarToggleButton />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto">
        {visibleSections.map((section) => (
          <NavSection
            key={section.id}
            section={section}
            userRole={userRole}
            pathname={pathname}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </SidebarContent>

      {/* Footer con usuario */}
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  className="w-full"
                  tooltip={
                    isCollapsed ? (session?.user?.name || "Usuario") : undefined
                  }
                >
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {session?.user?.name
                        ? getInitials(session.user.name)
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <>
                      <div className="flex flex-1 flex-col items-start text-sm min-w-0">
                        <span className="font-medium truncate w-full">
                          {session?.user?.name || "Usuario"}
                        </span>
                        <span className="text-[10px] text-sidebar-foreground/60 truncate w-full">
                          {ROLE_LABELS[userRole] || userRole}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    </>
                  )}
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side={isCollapsed ? "right" : "top"}
                align="start"
                className="w-56"
              >
                <div className="px-2 py-1.5 border-b">
                  <p className="text-sm font-medium truncate">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-[10px]">
                    {ROLE_LABELS[userRole] || userRole}
                  </Badge>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer">
                    <UserCircle className="mr-2 h-4 w-4" />
                    {t.sidebar.myProfile}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/security" className="cursor-pointer">
                    <Shield className="mr-2 h-4 w-4" />
                    {t.sidebar.security}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/notifications" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    {t.sidebar.notifications}
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        {t.sidebar.configuration}
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/ayuda" className="cursor-pointer">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    {t.sidebar.help}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t.sidebar.logout}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
