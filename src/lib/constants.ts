import {
  Cog,
  Car,
  FlaskConical,
  Gift,
  Home,
  Gem,
  type LucideIcon,
  Shield,
  Thermometer,
  Sun,
  Zap,
  Ruler,
  FileText,
  Camera,
  Lightbulb,
  Sparkles,
} from "lucide-react";

// ── Project Start Journeys ────────────────────────────
export type ProjectJourney = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
};

export const projectJourneys: ProjectJourney[] = [
  {
    title: "I have an STL file ready",
    description:
      "Upload your 3D model. We'll review it for printability, recommend a material, and send you a quote within 24 hours.",
    icon: FileText,
    href: "#quote",
    color: "#38C8F5",
  },
  {
    title: "I need a custom part printed",
    description:
      "If you have a 3D model, we can manufacture it. Upload your file and tell us about your project.",
    icon: Sparkles,
    href: "#quote",
    color: "#38C8F5",
  },
  {
    title: "I have a broken or missing part",
    description:
      "If you already have an STL file for the replacement, upload it and we'll print it. If not, contact us. CAD and reverse-engineering may be available in the future.",
    icon: Camera,
    href: "#contact",
    color: "#38C8F5",
  },
  {
    title: "I'm not sure where to start",
    description:
      "No problem. Get in touch and describe what you're trying to do. We'll give you honest advice on whether 3D printing is the right solution.",
    icon: Lightbulb,
    href: "#contact",
    color: "#38C8F5",
  },
];

// ── Services ──────────────────────────────────────────
export type Service = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  examples: string[];
  image: string;
  /** CSS object-position that keeps the subject in frame when the photo is cropped */
  focus?: string;
};

export const services: Service[] = [
  {
    title: "Automotive Parts",
    description:
      "Clips, brackets, trim pieces, and functional components for restoration and custom builds. Printed in materials that handle heat and daily use.",
    icon: Car,
    href: "#quote",
    examples: ["Gauge pods", "Interior trim clips", "Mounting brackets"],
    image: "/services/automotive.jpg",
    focus: "50% 55%",
  },
  {
    title: "Functional Parts",
    description:
      "Gears, brackets, mounts, and mechanical components for real-world use. Strong, dimensionally accurate prints for applications that need to work.",
    icon: Cog,
    href: "#quote",
    examples: ["Gears & sprockets", "Enclosures", "Clips & fasteners"],
    image: "/services/functional.jpg",
    focus: "47% 50%",
  },
  {
    title: "Die-cast Modifications",
    description:
      "Body kits, wheel swaps, and custom accessories for die-cast collectors. Precise, clean prints that match your collection's scale and finish.",
    icon: Gem,
    href: "#quote",
    examples: ["Wheels & tyres", "Body kits", "Display stands"],
    image: "/services/diecast.jpg",
    focus: "52% 50%",
  },
  {
    title: "Prototypes",
    description:
      "Test fit, form, and function before committing to expensive tooling. Turn your CAD designs into physical parts quickly and affordably.",
    icon: FlaskConical,
    href: "#quote",
    examples: ["Product mockups", "Fitment samples", "Engineering checks"],
    image: "/services/prototypes.jpg",
    focus: "52% 50%",
  },
  {
    title: "Household & Hobby",
    description:
      "Custom organisers, replacement household parts, hobby accessories, and practical prints for everyday use around the home and workshop.",
    icon: Home,
    href: "#quote",
    examples: ["Desk organisers", "Planters", "Workshop tools"],
    image: "/services/household.jpg",
    focus: "55% 50%",
  },
  {
    title: "Custom Gifts",
    description:
      "Personalised keepsakes, trophies, and one-off creations. Thoughtful, made-to-order items manufactured with attention to every detail.",
    icon: Gift,
    href: "#quote",
    examples: ["Bespoke gifts", "Trophies & awards", "Personalised keychains"],
    image: "/services/gifts.jpg",
    focus: "52% 45%",
  },
];

// ── Materials ─────────────────────────────────────────
export type MaterialStat = {
  label: string;
  value: string;
  icon: LucideIcon;
};

export type Material = {
  name: string;
  description: string;
  stats: MaterialStat[];
  color: string;
  textColor: string;
  borderColor: string;
  shrinkage?: string;
};

export const materials: Material[] = [
  {
    name: "PLA",
    description:
      "The workhorse of desktop manufacturing. Stiff, easy to print, and available in hundreds of colours. Ideal for prototypes, display models, and low-stress applications.",
    stats: [
      { label: "Strength", value: "Medium", icon: Shield },
      { label: "Heat Resistance", value: "Up to 55°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Not recommended", icon: Sun },
      { label: "Best For", value: "Prototypes, décor, gifts", icon: Zap },
    ],
    color: "#38C8F5",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    shrinkage: "~0.2–0.5%",
  },
  {
    name: "PETG",
    description:
      "The sweet spot between ease and performance. Stronger than PLA with better heat resistance and flexibility. Food-safe variants available for kitchen applications.",
    stats: [
      { label: "Strength", value: "High", icon: Shield },
      { label: "Heat Resistance", value: "Up to 75°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Good", icon: Sun },
      { label: "Best For", value: "Functional parts, enclosures", icon: Zap },
    ],
    color: "#3B82F6",
    textColor: "text-blue-400",
    borderColor: "border-blue-500/20",
    shrinkage: "~0.3–0.8%",
  },
  {
    name: "ABS",
    description:
      "Industry-standard thermoplastic. Exceptional impact resistance and durability. Used in automotive interiors, appliance housings, and LEGO bricks.",
    stats: [
      { label: "Strength", value: "Very High", icon: Shield },
      { label: "Heat Resistance", value: "Up to 95°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Good with coating", icon: Sun },
      { label: "Best For", value: "Automotive, tough parts", icon: Zap },
    ],
    color: "#F59E0B",
    textColor: "text-amber-400",
    borderColor: "border-amber-500/20",
    shrinkage: "~1.0–1.5%",
  },
  {
    name: "ASA",
    description:
      "ABS's outdoor-ready sibling. Superior UV resistance and weatherability make ASA the definitive choice for exterior automotive trim, signage, and outdoor enclosures.",
    stats: [
      { label: "Strength", value: "Very High", icon: Shield },
      { label: "Heat Resistance", value: "Up to 95°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Excellent", icon: Sun },
      { label: "Best For", value: "Outdoor, automotive", icon: Zap },
    ],
    color: "#10B981",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    shrinkage: "~0.8–1.2%",
  },
  {
    name: "TPU",
    description:
      "Flexible, rubber-like filament ranging from 85A to 95A shore hardness. Produces gaskets, phone cases, vibration dampeners, and wearable devices.",
    stats: [
      { label: "Strength", value: "Medium–High", icon: Shield },
      { label: "Heat Resistance", value: "Up to 60°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Moderate", icon: Sun },
      { label: "Best For", value: "Flexible parts, wearables", icon: Zap },
    ],
    color: "#8B5CF6",
    textColor: "text-violet-400",
    borderColor: "border-violet-500/20",
    shrinkage: "~0.5–1.0%",
  },
  {
    name: "Carbon Fiber Composite",
    description:
      "Engineering-grade filament reinforced with chopped carbon fibre. Exceptional stiffness-to-weight ratio and dimensional stability. For when aluminium is overkill but PLA isn't enough.",
    stats: [
      { label: "Strength", value: "Extreme", icon: Shield },
      { label: "Heat Resistance", value: "Up to 115°C", icon: Thermometer },
      { label: "Outdoor Use", value: "Excellent", icon: Sun },
      { label: "Best For", value: "Structural, drone, jigs", icon: Zap },
    ],
    color: "#6B7280",
    textColor: "text-gray-400",
    borderColor: "border-gray-500/20",
    shrinkage: "~0.1–0.3%",
  },
];

// ── How It Works ──────────────────────────────────────
export type Step = {
  number: string;
  title: string;
  description: string;
};

export const steps: Step[] = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Upload a file, send a photo, or describe your idea. Choose the path that best fits your situation. We meet you where you are.",
  },
  {
    number: "02",
    title: "We review and quote",
    description:
      "We assess your project within 24 hours. You'll get a clear, itemised quote with material recommendations and timeline.",
  },
  {
    number: "03",
    title: "We manufacture",
    description:
      "Once confirmed, your job enters production. Professional FDM printers run with quality monitoring. We keep you updated throughout.",
  },
  {
    number: "04",
    title: "Quality check and deliver",
    description:
      "Every part is inspected, finished, and carefully packaged. Island-wide delivery or pickup from our Colombo facility. Your choice.",
  },
];

// ── Gallery Projects ──────────────────────────────────
export type GalleryProject = {
  id: string;
  title: string;
  category: string;
  imageLight: string;
  imageDark: string;
  description: string;
};

export const projectCategories = [
  "All",
  "Automotive",
  "Functional",
  "Die-cast",
  "Prototypes",
  "Household",
  "Gifts",
] as const;

export const galleryProjects: GalleryProject[] = [
  {
    id: "1",
    title: "Intake Manifold Prototype",
    category: "Automotive",
    imageLight: "/projects/intake.jpg",
    imageDark: "/projects/intake.jpg",
    description:
      "Functional intake manifold printed in ASA for thermal testing on a modified 4-cylinder engine. Printed as a single-piece test unit.",
  },
  {
    id: "2",
    title: "Dashboard Gauge Pod",
    category: "Automotive",
    imageLight: "/projects/gauge.jpg",
    imageDark: "/projects/gauge.jpg",
    description:
      "A-pillar gauge pod printed in ASA to match OEM texture. Housed boost and oil pressure gauges for a classic restoration build.",
  },
  {
    id: "3",
    title: "Custom Mounting Bracket Set",
    category: "Functional",
    imageLight: "/projects/bracket.jpg",
    imageDark: "/projects/bracket.jpg",
    description:
      "Set of custom brackets printed in PETG for an electronics project. Designed by the customer, manufactured by us.",
  },
  {
    id: "4",
    title: "Turbine Housing Mock-up",
    category: "Prototypes",
    imageLight: "/projects/turbine.jpg",
    imageDark: "/projects/turbine.jpg",
    description:
      "Full-scale prototype turbine housing for fitment verification before CNC machining. Printed in carbon fibre composite.",
  },
  {
    id: "5",
    title: "Drone Arm Assembly",
    category: "Prototypes",
    imageLight: "/projects/drone.jpg",
    imageDark: "/projects/drone.jpg",
    description:
      "Carbon-fibre-reinforced drone arms with integrated motor mounts. Tested under load for a customer's custom UAV build.",
  },
  {
    id: "6",
    title: "Die-cast Wheel Set",
    category: "Die-cast",
    imageLight: "/projects/diecast.jpg",
    imageDark: "/projects/diecast.jpg",
    description:
      "Custom wheel and tyre set for a 1:64 scale die-cast model. Printed in high-detail resin for a collector's restoration project.",
  },
  {
    id: "7",
    title: "Minimalist Pendant Lamp",
    category: "Household",
    imageLight: "/projects/lamp.jpg",
    imageDark: "/projects/lamp.jpg",
    description:
      "Translucent PETG lampshade with integrated cable management. Printed for a local interior design project.",
  },
  {
    id: "8",
    title: "Workshop Tool Organiser",
    category: "Household",
    imageLight: "/projects/organiser.jpg",
    imageDark: "/projects/organiser.jpg",
    description:
      "Custom modular tool organiser printed in PETG. Designed by the customer to fit their specific workshop drawer layout.",
  },
  {
    id: "9",
    title: "Personalised Trophy Set",
    category: "Gifts",
    imageLight: "/projects/trophy.jpg",
    imageDark: "/projects/trophy.jpg",
    description:
      "Custom award trophies for a local motorsport event. Printed in PLA with metallic post-processing and engraved nameplates.",
  },
];

// ── FAQ ────────────────────────────────────────────────
export type FAQ = {
  question: string;
  answer: string;
};

export const faqs: FAQ[] = [
  {
    question: "What file formats do you accept?",
    answer:
      "We accept STL, OBJ, 3MF, and STEP files. For assemblies, ZIP archives containing multiple files are recommended. Maximum single file size is 250 MB. For larger projects, contact us directly.",
  },
  {
    question: "I don't have an STL file. Can you still help?",
    answer:
      "Our current service is printing customer-provided 3D models. If you have a 3D file, we can manufacture it. If you only have an idea or a broken part with no model, contact us. CAD modelling and reverse engineering may become available in the future, but are not currently offered.",
  },
  {
    question: "What materials can you print in?",
    answer:
      "Our material lineup includes PLA, PETG, ABS, ASA, and TPU. Carbon-fibre-reinforced composites are available on a per-project basis. Each material has different properties: strength, flexibility, heat resistance, and UV stability. We'll help you choose the right one for your project.",
  },
  {
    question: "How long does printing take?",
    answer:
      "Production time depends on part size, complexity, and material. Small parts (keychains, brackets) typically ship within 2–3 business days. Larger projects may take 5–10 business days. You'll receive an estimated timeline with your quotation.",
  },
  {
    question: "Do you offer post-processing?",
    answer:
      "Yes. Standard post-processing includes support removal and light sanding. Additional services include vapour smoothing (ABS/ASA), primer application, painting, and clear-coat finishing. These are available at quoted rates. Tell us about your finishing requirements when you submit your project.",
  },
  {
    question: "Can you print in multiple colours?",
    answer:
      "Single-colour prints are our standard. Multi-colour printing is possible for select projects using manual filament changes. Note that multi-colour adds print time and cost. Contact us with your specific requirements.",
  },
  {
    question: "Can you modify my file if it needs adjustments?",
    answer:
      "We provide basic printability feedback and can make minor file repairs to ensure a successful print. Full design changes or modifications to your model are not currently offered. For best results, provide a ready-to-print STL file.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We currently ship within Sri Lanka with island-wide delivery. International shipping may be available upon request for select projects. Contact us to discuss.",
  },
  {
    question: "How are prices calculated?",
    answer:
      "Pricing is based on material volume, print time, post-processing requirements, and quantity. You'll receive a transparent, itemised quote before any work begins. Rush orders and complex geometries may affect pricing.",
  },
  {
    question: "Is there a minimum order quantity?",
    answer:
      "No. We manufacture single one-off prints as well as small batch runs. Per-unit cost typically decreases with quantity. We're happy to discuss volume pricing for recurring orders.",
  },
];

// ── About ─────────────────────────────────────────────
export const aboutText = {
  heading: "A workshop, not a factory.",
  paragraph1:
    "Zenki Lab started with a real problem: restoring classic Toyota vehicles when original replacement parts were no longer available. Rather than giving up, we manufactured our own. That same capability is now offered to anyone who needs custom printed parts.",
  paragraph2:
    "We're not trying to be a print farm. Every project, whether a single bracket or a batch of 50 parts, gets the same level of care we'd expect for our own builds. Honest advice, clear communication, and parts that fit right the first time.",
};

// ── Coming Soon ───────────────────────────────────────
export type ComingSoonFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const comingSoonFeatures: ComingSoonFeature[] = [
  {
    title: "Customer Dashboard",
    description: "Track your orders and project history in one place.",
    icon: FileText,
  },
  {
    title: "Live Print Monitoring",
    description: "Watch your parts being manufactured in real time.",
    icon: Camera,
  },
  {
    title: "Timelapse Downloads",
    description: "Get a timelapse video of your print from start to finish.",
    icon: Camera,
  },
  {
    title: "CAD & Design Assistance",
    description: "Professional modelling and reverse-engineering services.",
    icon: Sparkles,
  },
];

// ── Contact ────────────────────────────────────────────
export type ContactChannel = {
  label: string;
  value: string;
  href: string;
};

export const contactChannels: ContactChannel[] = [
  { label: "WhatsApp", value: "+94 70 2100 270", href: "https://wa.me/94702100270" },
  { label: "Email", value: "quote@zenkilab.com", href: "mailto:quote@zenkilab.com" },
  { label: "Instagram", value: "@zenkilab", href: "https://instagram.com/zenkilab" },
  { label: "Facebook", value: "/zenkilab", href: "https://facebook.com/zenkilab" },
  { label: "TikTok", value: "@zenkilab", href: "https://tiktok.com/@zenkilab" },
];

// ── Footer ─────────────────────────────────────────────
export const footerLinks = [
  {
    title: "Services",
    links: [
      { label: "Custom Parts", href: "#services" },
      { label: "Automotive", href: "#services" },
      { label: "Prototypes", href: "#services" },
      { label: "Gifts", href: "#services" },
    ],
  },
  {
    title: "Materials",
    links: [
      { label: "PLA", href: "#materials" },
      { label: "PETG", href: "#materials" },
      { label: "ABS", href: "#materials" },
      { label: "ASA", href: "#materials" },
      { label: "TPU", href: "#materials" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Projects", href: "#projects" },
      { label: "FAQ", href: "#faq" },
      { label: "Contact", href: "#contact" },
      { label: "Start a Project", href: "#quote" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund Policy", href: "#" },
    ],
  },
];
