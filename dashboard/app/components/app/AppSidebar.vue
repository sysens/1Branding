<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  ChartPie,
  CheckSquare,
  ChevronsUpDown,
  Globe,
  Kanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Moon,
  Receipt,
  Settings,
  Sun,
  Users,
  Wallet,
} from "@lucide/vue";
import { useColorMode } from "@vueuse/core";
import { ROLE_LABELS } from "#shared/utils/constants";

const props = defineProps<SidebarProps>();
const route = useRoute();
const me = useMe();
const colorMode = useColorMode();

const analytics = [
  { title: "Сводка", to: "/", icon: LayoutDashboard },
  { title: "Каналы и реклама", to: "/channels", icon: Megaphone },
  { title: "Сайт", to: "/site", icon: Globe },
];
const crm = [
  { title: "Воронка", to: "/deals", icon: Kanban },
  { title: "Клиенты", to: "/clients", icon: Users },
  { title: "Задачи", to: "/tasks", icon: CheckSquare },
];
const money = [
  { title: "Финансы", to: "/finance", icon: Wallet },
  { title: "Расходы", to: "/expenses", icon: Receipt },
];

const isActive = (to: string) => (to === "/" ? route.path === "/" : route.path.startsWith(to));
const initials = computed(() => (me.value?.name ?? "?").split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase());

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  me.value = null;
  await navigateTo("/login");
}
</script>

<template>
  <Sidebar v-bind="props" collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-sm font-semibold">1</div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">OneBranding</span>
                <span class="text-muted-foreground truncate text-xs">Трафик, заявки, деньги</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup v-for="group in [{ label: 'Аналитика', items: analytics }, { label: 'Продажи', items: crm }, { label: 'Деньги', items: money }]" :key="group.label">
        <SidebarGroupLabel>{{ group.label }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in group.items" :key="item.to">
              <SidebarMenuButton as-child :is-active="isActive(item.to)" :tooltip="item.title">
                <NuxtLink :to="item.to">
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup class="mt-auto">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton as-child :is-active="isActive('/settings')" tooltip="Настройки">
                <NuxtLink to="/settings">
                  <Settings />
                  <span>Настройки</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Тема" @click="colorMode = colorMode === 'dark' ? 'light' : 'dark'">
                <Moon v-if="colorMode !== 'dark'" />
                <Sun v-else />
                <span>{{ colorMode === "dark" ? "Светлая тема" : "Тёмная тема" }}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <SidebarMenuButton size="lg" class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                <Avatar class="size-8 rounded-lg">
                  <AvatarFallback class="rounded-lg">{{ initials }}</AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">{{ me?.name }}</span>
                  <span class="text-muted-foreground truncate text-xs">{{ me ? ROLE_LABELS[me.role] : "" }}</span>
                </div>
                <ChevronsUpDown class="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg" side="top" align="end" :side-offset="4">
              <DropdownMenuLabel class="font-normal">
                <div class="grid text-sm leading-tight">
                  <span class="font-medium">{{ me?.name }}</span>
                  <span class="text-muted-foreground text-xs">{{ me?.email }}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem as-child>
                <NuxtLink to="/settings?tab=profile">
                  <ChartPie />
                  Профиль и безопасность
                </NuxtLink>
              </DropdownMenuItem>
              <DropdownMenuItem @click="logout">
                <LogOut />
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>
