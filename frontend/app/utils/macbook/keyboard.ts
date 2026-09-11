import {
  SunDim, Sun, PanelsTopLeft, Search, Mic, Moon, SkipBack, Play,
  SkipForward, VolumeX, Volume1, Volume2, Globe, ChevronUp, Command,
  Option,
} from "lucide-vue-next";
import type { Component } from "vue";

export type MacbookKey = {
  label: string;
  secondary?: string;
  icon?: Component;
  width?: number;
  align?: "left" | "right";
  modifier?: boolean;
  touchId?: boolean;
};

const letters = (text: string): MacbookKey[] =>
  text.split(" ").map(label => ({ label }));

export const keyboardRows: MacbookKey[][] = [
  [
    { label: "esc", width: 40, align: "left" },
    ...[SunDim, Sun, PanelsTopLeft, Search, Mic, Moon, SkipBack, Play,
      SkipForward, VolumeX, Volume1, Volume2].map((icon, index) => ({
      label: `F${index + 1}`, icon,
    })),
    { label: "", touchId: true },
  ],
  [
    { label: "`", secondary: "~" },
    ..."1234567890".split("").map((label, index) => ({
      label, secondary: "!@#$%^&*()"[index],
    })),
    { label: "_", secondary: "\u2014" }, { label: "=", secondary: "+" },
    { label: "delete", width: 40, align: "right" },
  ],
  [
    { label: "tab", width: 40, align: "left" }, ...letters("Q W E R T Y U I O P"),
    { label: "[", secondary: "{" }, { label: "]", secondary: "}" },
    { label: "\\", secondary: "|" },
  ],
  [
    { label: "caps lock", width: 44.8, align: "left" }, ...letters("A S D F G H J K L"),
    { label: ";", secondary: ":" }, { label: "'", secondary: '"' },
    { label: "return", width: 45.6, align: "right" },
  ],
  [
    { label: "shift", width: 58.4, align: "left" }, ...letters("Z X C V B N M"),
    { label: ",", secondary: "<" }, { label: ".", secondary: ">" },
    { label: "/", secondary: "?" }, { label: "shift", width: 58.4, align: "right" },
  ],
  [
    { label: "fn", icon: Globe, modifier: true }, { label: "control", icon: ChevronUp, modifier: true },
    { label: "option", icon: Option, modifier: true },
    { label: "command", icon: Command, width: 32, modifier: true },
    { label: "", width: 131.2 },
    { label: "command", icon: Command, width: 32, modifier: true },
    { label: "option", icon: Option, modifier: true },
  ],
];
