"use client";

import { useState } from "react";

const DIAL_CODES = [
  { code: "+84",  country: "Vietnam",        flag: "🇻🇳" },
  { code: "+65",  country: "Singapore",      flag: "🇸🇬" },
  { code: "+66",  country: "Thailand",       flag: "🇹🇭" },
  { code: "+62",  country: "Indonesia",      flag: "🇮🇩" },
  { code: "+60",  country: "Malaysia",       flag: "🇲🇾" },
  { code: "+63",  country: "Philippines",    flag: "🇵🇭" },
  { code: "+1",   country: "United States",  flag: "🇺🇸" },
  { code: "+44",  country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61",  country: "Australia",      flag: "🇦🇺" },
  { code: "+91",  country: "India",          flag: "🇮🇳" },
  { code: "+86",  country: "China",          flag: "🇨🇳" },
  { code: "+81",  country: "Japan",          flag: "🇯🇵" },
  { code: "+82",  country: "South Korea",    flag: "🇰🇷" },
  { code: "+852", country: "Hong Kong",      flag: "🇭🇰" },
  { code: "+886", country: "Taiwan",         flag: "🇹🇼" },
  { code: "+971", country: "UAE",            flag: "🇦🇪" },
  { code: "+49",  country: "Germany",        flag: "🇩🇪" },
  { code: "+33",  country: "France",         flag: "🇫🇷" },
];

export interface PhoneValue {
  dialCode: string;
  number: string;
}

interface PhoneInputProps {
  value: PhoneValue;
  onChange: (v: PhoneValue) => void;
  id?: string;
  required?: boolean;
  placeholder?: string;
}

export default function PhoneInput({
  value,
  onChange,
  id,
  required,
  placeholder = "Phone number",
}: PhoneInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div
      className={`flex h-10 w-full overflow-hidden rounded-[calc(var(--radius)*0.75)] border bg-background transition-all ${
        focused
          ? "border-ring ring-[3px] ring-ring/20"
          : "border-input"
      }`}
    >
      {/* Dial code select */}
      <select
        aria-label="Country dialing code"
        value={value.dialCode}
        onChange={(e) => onChange({ ...value, dialCode: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="shrink-0 border-0 bg-transparent pl-2 pr-1 text-sm text-foreground outline-none cursor-pointer hover:bg-secondary transition-colors"
        style={{ width: "5.5rem" }}
      >
        {DIAL_CODES.map((d) => (
          <option key={`${d.code}-${d.country}`} value={d.code}>
            {d.flag} {d.code}
          </option>
        ))}
      </select>

      {/* Divider */}
      <div className="w-px bg-border self-stretch my-1.5" />

      {/* Number input */}
      <input
        id={id}
        type="tel"
        required={required}
        autoComplete="tel-national"
        value={value.number}
        onChange={(e) => onChange({ ...value, number: e.target.value })}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className="flex-1 border-0 bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0"
      />
    </div>
  );
}
