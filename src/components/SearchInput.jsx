import { Input } from "antd";
import { Search } from "lucide-react";
import "./SearchInput.css";

const SearchInput = ({
  placeholder = "Search...",
  onSearch,
  onChange,
  allowClear = true,
  value,
  style,
  className = "",
  size = "middle",
  ...props
}) => {
  return (
    <div className={`search-input-wrapper ${className}`} style={style}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onPressEnter={(e) => onSearch && onSearch(e.target.value)}
        allowClear={allowClear}
        size={size}
        className="search-input-field"
        prefix={<Search size={16} className="search-icon" />}
        {...props}
      />
    </div>
  );
};

export default SearchInput;