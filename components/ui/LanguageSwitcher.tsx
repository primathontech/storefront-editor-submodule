import React from "react";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "./Select";

interface LanguageSwitcherProps {
  supportedLanguages: string[];
  selectedLang: string;
  onSelectLang: (lang: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  supportedLanguages,
  selectedLang,
  onSelectLang,
}) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Language:</span>
      <Select value={selectedLang} onValueChange={onSelectLang}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {supportedLanguages.map((lang) => (
            <SelectItem key={lang} value={lang}>
              {lang}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
