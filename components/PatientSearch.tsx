"use client";

import { useState, useEffect } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PatientSearchProps {
  onSearch: (term: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PatientSearch({ 
  onSearch, 
  placeholder = "Search patients...",
  className = "mb-4"
}: PatientSearchProps) {
  const [term, setTerm] = useState("");
  const debouncedTerm = useDebounce(term, 300);

  useEffect(() => {
    if (debouncedTerm.length >= 2) {
      onSearch(debouncedTerm);
    } else if (debouncedTerm.length === 0) {
      // Clear search when input is empty
      onSearch("");
    }
  }, [debouncedTerm, onSearch]);

  return (
    <div className={className}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={placeholder}
          className="pl-10"
        />
      </div>
      {term.length > 0 && term.length < 2 && (
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
          <span>💡</span>
          Enter at least 2 characters to search
        </p>
      )}
    </div>
  );
}