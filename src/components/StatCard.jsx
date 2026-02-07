import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Users, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function StatCard({
  title,
  value,
  percentage,
  meta,
  icon,
  color = "#3b82f6",
  linkTo,
  arrowColor = "#fff",
  noBg = false,
}) {
  const isPositive = percentage >= 1;
  const arrowIconColor = arrowColor;
  const navigate = useNavigate();

  // Enhanced responsive detection
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === "undefined") return "lg";
    const width = window.innerWidth;
    if (width < 640) return "sm";
    if (width < 768) return "md";
    if (width < 1024) return "lg";
    return "xl";
  });

  useEffect(() => {
    const onResize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize("sm");
      else if (width < 768) setScreenSize("md");
      else if (width < 1024) setScreenSize("lg");
      else setScreenSize("xl");
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Enhanced value formatting for different screen sizes
  const formatValue = (input) => {
    // Extract currency symbol (₹, $, etc.)
    const currencyMatch = String(input).match(/^[^\d.-]+/);
    const currency = currencyMatch ? currencyMatch[0] : "";

    // Extract numeric value
    const numeric = parseFloat(String(input).replace(/[^\d.-]/g, ""));
    if (isNaN(numeric)) return input;

    // Format based on screen size and value
    if (screenSize === "sm" && numeric >= 1000) {
      let formatted;
      if (numeric >= 1_000_000) {
        formatted = (numeric / 1_000_000).toFixed(1) + "M";
      } else {
        formatted = (numeric / 1000).toFixed(1) + "k";
      }
      formatted = formatted.replace(".0", "");
      return `${currency}${formatted}`;
    }

    if ((screenSize === "md" || screenSize === "lg") && numeric >= 10000) {
      let formatted;
      if (numeric >= 1_000_000) {
        formatted = (numeric / 1_000_000).toFixed(1) + "M";
      } else {
        formatted = (numeric / 1000).toFixed(0) + "k";
      }
      return `${currency}${formatted}`;
    }

    return input;
  };

  const displayValue = formatValue(value);

  const getResponsiveClasses = () => {
    const base = "relative bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all duration-200";

    switch (screenSize) {
      case "sm":
        return `${base} p-3`;
      case "md":
        return `${base} p-4`;
      case "lg":
        return `${base} p-4`;
      default:
        return `${base} p-5`;
    }
  };

  // Responsive icon and arrow sizes
  const getIconSize = () => {
    switch (screenSize) {
      case "sm": return { icon: 20, container: "w-10 h-10", arrow: "w-8 h-8", arrowIcon: 14, gif: "w-8 h-8" };
      case "md": return { icon: 22, container: "w-12 h-12", arrow: "w-9 h-9", arrowIcon: 15, gif: "w-10 h-10" };
      case "lg": return { icon: 24, container: "w-14 h-14", arrow: "w-10 h-10", arrowIcon: 16, gif: "w-12 h-12" };
      default: return { icon: 26, container: "w-16 h-16", arrow: "w-11 h-11", arrowIcon: 18, gif: "w-14 h-14" };
    }
  };

  const iconSizes = getIconSize();

  // Responsive text classes
  const getTextClasses = () => {
    switch (screenSize) {
      case "sm":
        return {
          value: "text-lg font-bold text-gray-800 leading-tight",
          meta: "text-xs text-gray-600",
          percentage: "text-xs font-medium"
        };
      case "md":
        return {
          value: "text-xl font-bold text-gray-800 leading-tight",
          meta: "text-sm text-gray-600",
          percentage: "text-sm font-medium"
        };
      case "lg":
        return {
          value: "text-2xl font-bold text-gray-800 leading-tight",
          meta: "text-sm text-gray-600",
          percentage: "text-sm font-medium"
        };
      default:
        return {
          value: "text-3xl font-bold text-gray-800 leading-tight",
          meta: "text-base text-gray-600",
          percentage: "text-base font-medium"
        };
    }
  };

  const textClasses = getTextClasses();

  // Animation for the value
  const springValue = useSpring(0, { stiffness: 50, damping: 20 });
  const displayValueRaw = useTransform(springValue, (current) => {
    // We need to preserve the formatting logic but apply it to the animated value
    // However, since formatValue depends on screenSize (state), using it inside useTransform might be tricky
    // simplifying: we will animate checking the final value type.

    // If value is a string with non-numeric chars (expect helper text), we might default to just showing value
    // parsing logic from formatValue:
    const numeric = parseFloat(String(value).replace(/[^\d.-]/g, ""));
    if (isNaN(numeric)) return value; // can't animate non-numbers properly this way without more logic

    // Use specific logic based on the target value
    return formatValue(Math.floor(current));
  });

  useEffect(() => {
    const numeric = parseFloat(String(value).replace(/[^\d.-]/g, ""));
    if (!isNaN(numeric)) {
      springValue.set(numeric);
    }
  }, [value, springValue]);

  // If value is a component (React element) or complex string that we can't easily parse/animate, 
  // we fallback to static display.
  const isAnimatable = !isNaN(parseFloat(String(value).replace(/[^\d.-]/g, ""))) && typeof value !== 'object';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={getResponsiveClasses()}
      onClick={() => linkTo && navigate(linkTo)}
    >
      {/* Arrow - Responsive positioning and sizing */}
      {linkTo && (
        <Link
          to={linkTo}
          aria-label={`Go to ${title || "detail"}`}
          className={`absolute ${screenSize === "sm" ? "top-2 right-2" : "top-3 right-3"} transform transition-transform duration-150 hover:scale-105`}
        >
          {/* <div
            className={`${iconSizes.arrow} rounded-full flex items-center justify-center`}
            style={{
              background: noBg ? "#f3f4f6" : color,
              boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
            }}
          >
            <ArrowRight size={iconSizes.arrowIcon} color={noBg ? "#374151" : arrowIconColor} />
          </div> */}
        </Link>
      )}

      {/* Main content - Responsive layout */}
      <div className={`flex ${screenSize === "sm" ? "flex-col gap-1" : "justify-between items-start"}`}>
        <div className={`flex ${screenSize === "sm" ? "items-center gap-2" : "gap-3 items-start flex-1"}`}>
          {/* Icon */}
          <div
            className={`${iconSizes.container} ${screenSize === "sm" ? "mt-0" : "mt-1"} flex justify-center items-center rounded-lg flex-shrink-0`}
            style={noBg ? {} : { background: color }}
          >
            {icon ? icon : <Users size={iconSizes.icon} style={{ color: noBg ? color : "#fff" }} />}
          </div>

          {/* Value and Title */}
          <div className={`${screenSize === "sm" ? "flex-1" : ""}`}>
            {/* Title - Show on small screens */}
            {screenSize === "sm" && title && (
              <h3 className="text-sm font-medium text-gray-700 mb-1 leading-tight">
                {title}
              </h3>
            )}


            <h2 className={`${textClasses.value} ${screenSize === "sm" ? "mb-0" : "pt-1"}`}>
              {isAnimatable ? <motion.span>{displayValueRaw}</motion.span> : displayValue}
            </h2>
          </div>
        </div>

        {/* Percentage - Responsive positioning */}
        {typeof percentage !== "undefined" && (
          <div
            className={`${textClasses.percentage} flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"
              } ${screenSize === "sm" ? "self-end" : ""}`}
          >
            <span>{percentage > 0 ? "+" : ""}{percentage}%</span>
          </div>
        )}
      </div>

      {/* Meta information - Reduced spacing */}
      <div className={`${screenSize === "sm" ? "mt-1" : "mt-2"}`}>
        <span className={textClasses.meta}>
          {meta}
        </span>
      </div>
    </motion.div>
  );
}