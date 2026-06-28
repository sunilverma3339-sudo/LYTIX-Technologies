import React from "react";
import { Check, CircleDot } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkflowStepper({ workflow = [], current }) {
  const currentIndex = Math.max(0, workflow.indexOf(current));
  const progress = Math.max(0, Math.min(1, currentIndex / Math.max(workflow.length - 1, 1)));

  return (
    <div className="workflow-grid relative">
      <div className="pointer-events-none absolute left-4 right-4 top-7 hidden h-0.5 overflow-hidden rounded-full bg-slate-200 lg:block">
        <motion.span
          className="block h-full origin-left rounded-full bg-gradient-to-r from-blue-600 to-cyan-400"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      {workflow.map((stage, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        return (
          <motion.div
            key={stage}
            className={`workflow-step relative z-10 ${active ? "is-active" : ""}`}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
            whileHover={{ y: -4, boxShadow: "0 18px 42px rgba(37,99,235,0.16)" }}
            whileTap={{ scale: 0.985 }}
          >
            <span className={`workflow-dot ${done ? "is-done" : ""} ${active ? "is-active" : ""}`}>
              {done ? <Check size={14} /> : <CircleDot size={14} />}
            </span>
            <span>{stage}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
