"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { galleryProjects, projectCategories } from "@/lib/constants";

export function GallerySection() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const filtered =
    activeCategory === "All"
      ? galleryProjects
      : galleryProjects.filter((p) => p.category === activeCategory);

  const selected = galleryProjects.find((p) => p.id === selectedProject);

  return (
    <section id="projects" className="relative py-24 lg:py-28 bg-background border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-12 lg:mb-14"
        >
          <span className="text-xs font-semibold tracking-[0.15em] uppercase mb-4 block" style={{ color: "var(--color-accent-primary)" }}>
            Projects
          </span>
          <h2 className="text-[clamp(2rem,4.5vw,3rem)] font-bold tracking-[-0.02em] leading-[1.1] max-w-[700px]" style={{ color: "var(--color-text-primary)" }}>
            Real parts, real projects.
          </h2>
          <p className="text-lg mt-4 max-w-[600px] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
            A selection of work we've manufactured for our customers.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-2 mb-10">
          {projectCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={
                activeCategory === cat
                  ? { backgroundColor: "var(--color-accent-primary)", color: "var(--color-bg-primary)" }
                  : { backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border)" }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        <motion.div layout className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((project, idx) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, delay: idx * 0.04 }}
                className="break-inside-avoid group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
                onClick={() => setSelectedProject(project.id)}
              >
                <div className="aspect-[4/3] flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-bg-surface), var(--color-border))" }}>
                  <ImageIcon className="w-12 h-12" style={{ color: "#3B4656" }} />
                </div>

                <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-all duration-400 flex items-center justify-center">
                  <span
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl"
                    style={{ backgroundColor: "var(--color-accent-primary)", color: "var(--color-bg-primary)" }}
                  >
                    View Details
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="p-5">
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-1.5 block" style={{ color: "var(--color-accent-primary)" }}>
                    {project.category}
                  </span>
                  <h3 className="text-sm font-semibold leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {project.title}
                  </h3>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-6"
            style={{ backgroundColor: "rgba(8,10,14,0.7)" }}
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-[640px] w-full rounded-2xl overflow-hidden relative"
              style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="aspect-video flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--color-bg-surface), var(--color-border))" }}>
                <ImageIcon className="w-16 h-16" style={{ color: "#3B4656" }} />
              </div>
              <div className="p-8">
                <span className="text-[10px] font-semibold tracking-[0.12em] uppercase mb-2 block" style={{ color: "var(--color-accent-primary)" }}>
                  {selected.category}
                </span>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
                  {selected.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {selected.description}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: "var(--color-bg-surface)", border: "1px solid var(--color-border)", color: "var(--color-text-primary)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}