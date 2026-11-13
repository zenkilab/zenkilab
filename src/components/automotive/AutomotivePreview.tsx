"use client";

import { useRef, useState } from "react";
import { contactChannels } from "@/lib/constants";
import { automotiveBrands, borderOptions, registrationLayout, preferenceMessage, type Border, type Shape } from "@/lib/automotive";
import styles from "./preview.module.css";
import { Logomark } from "@/components/layout/logomark";

export default function AutomotivePreview({ assetRoot }: { assetRoot: string }) {
  const heroRef = useRef<HTMLButtonElement>(null);
  const closeZoom = () => { setZoom(false); heroRef.current?.focus(); };
  const [shape, setShape] = useState<Shape>("capsule");
  const [border, setBorder] = useState<Border>("none");
  const [brand, setBrand] = useState("mercedes");
  const [registration, setRegistration] = useState("CAV 3883");
  const [back, setBack] = useState(false);
  const [zoom, setZoom] = useState(false);
  const layout = registrationLayout(registration);
  const selectedBrand = automotiveBrands.find(b=>b.id===brand)!;
  const sourced = ["toyota","honda","nissan","audi","mitsubishi","hyundai","kia"].includes(brand);
  const generated = selectedBrand.available && selectedBrand.generatedRegistrations.includes(layout.text) && layout.valid;
  const source = (s: Shape, face: "front" | "back" | "mesh") => `${assetRoot}/${s}-${border}-${face}.png`;
  const whatsapp = contactChannels.find(c=>c.label==="WhatsApp")!.href;
  const message = preferenceMessage(selectedBrand.name, layout.text, shape, border, generated);
  return <main className={styles.page}>
    <header className={styles.header}><a href="/" className={styles.wordmark}><Logomark size={34} /><span>Zenki Lab</span></a><span className={styles.private}>Customer preview · Unlisted</span></header>
    <section className={styles.intro}><p className={styles.eyebrow}>MADE FOR YOUR DRIVE</p><h1>A small detail.<br /><span>Distinctly yours.</span></h1><p>White. Navy. Precisely sculpted. Find the finish for your automotive keytag.</p></section>
    <div className={styles.workspace}>
      <section className={styles.visual} aria-label="Design comparison">
        <div className={styles.visualHeading}><span>{generated ? "Your generated design" : "Reference design · CAV 3883"}</span><div className={styles.toggle}><button aria-pressed={!back} onClick={()=>setBack(false)}>Front</button><button aria-pressed={back} onClick={()=>setBack(true)}>Back</button></div></div>
        {selectedBrand.available ? <>
          <button ref={heroRef} className={styles.heroImage} onClick={()=>setZoom(true)} aria-label="Zoom selected design"><img src={source(shape,back?"back":"mesh")} alt={`${shape} ${border} border ${back?"back with correctly oriented ZenkiLab.com":"front with sculpted Mercedes emblem and CAV 3883"}`} /><span>Tap to inspect ↗</span></button>
          <div className={styles.specs}><span>58 × 28 mm</span><span>3.2 mm body</span><span>3.92 mm max</span></div>
          <div className={styles.comparison}>{(["capsule","rounded-rectangle"] as const).map(s=><button key={s} aria-pressed={shape===s} onClick={()=>setShape(s)}><img src={source(s,back?"back":"front")} alt={`${s} ${back?"back":"front"}`} /><strong>{s==="capsule"?"Capsule":"Rounded rectangle"}</strong><small>{s==="capsule"?"Soft R14 ends":"Precision R5 corners"}</small></button>)}</div>
          <p className={styles.caption}>CAD-derived renders for Mercedes CAV 3883. {generated ? "Both shapes and all four borders have generated geometry." : "Your new registration is a request; the image still shows the generated reference."} Back render shows optional navy fill in the recess.</p>
        </> : <div className={styles.inquiry}><span>YOUR LOGO, CONSIDERED.</span><h2>{selectedBrand.name}</h2><p>Send us your logo reference for a proportion and printability review. A verified printable asset is not yet available for this brand.</p><p>No substitute logo is shown.</p>{sourced && <img style={{width:140,height:100,objectFit:"contain",background:"white",padding:16,borderRadius:12}} src={`/automotive-logos/${brand}.svg`} alt={`${selectedBrand.name} sourced emblem, commercial authorization unverified`} />}<p>Source verified at a pinned upstream version. Original artwork license and trademark authorization remain unverified. Inquiry only.</p></div>}
      </section>
      <section className={styles.controls} aria-label="Customize your preference"><p className={styles.eyebrow}>THE DETAILS</p><h2>Choose your finish</h2>
        <label htmlFor="brand">Vehicle brand</label><select id="brand" value={brand} onChange={e=>setBrand(e.target.value)}>{automotiveBrands.map(b=><option key={b.id} value={b.id}>{b.name} · {b.available?"Generated":"Inquiry only"}</option>)}</select>
        <label htmlFor="registration">Registration</label><input id="registration" value={registration} maxLength={12} onChange={e=>setRegistration(e.target.value.toUpperCase())} aria-describedby="layout-status" aria-invalid={!layout.valid} autoComplete="off" spellCheck={false} />
        <p id="layout-status" className={styles.help} role="status">{generated ? "CAV 3883: CAD checked. At least 5.96 mm clearance to the body edge." : layout.reason} {layout.valid && !generated && `${layout.width.toFixed(1)} × ${layout.height.toFixed(1)} mm lettering.`}</p>
        <fieldset><legend>Shape</legend><div className={styles.options}>{(["capsule","rounded-rectangle"] as const).map(s=><button key={s} aria-pressed={shape===s} onClick={()=>setShape(s)}>{s==="capsule"?"Capsule":"Rounded rectangle"}</button>)}</div></fieldset>
        <fieldset><legend>Navy outline</legend><div className={styles.borders}>{borderOptions.map(b=><button key={b.id} aria-pressed={border===b.id} onClick={()=>setBorder(b.id)}><strong>{b.name}</strong><small>{b.detail}</small></button>)}</div></fieldset>
        <div className={styles.status}><span className={styles.dot} />{generated ? "Generated and geometry checked" : "Inquiry only · CAD review required"}<small>{generated ? "Your selected shape and border are ready for design review. Slicing and a first print are still required." : "Changing the brand or registration does not create approved manufacturing geometry."}</small></div>
        <a className={styles.cta} aria-disabled={!layout.valid} href={layout.valid ? `${whatsapp}?text=${encodeURIComponent(message)}` : undefined} target="_blank" rel="noopener noreferrer">Request a Design Review <span>↗</span></a><p className={styles.help}>Opens a prepared WhatsApp message to Zenki Lab. You choose whether to send it. This is a design preference, not an order or payment.</p>
      </section>
    </div>
    <section aria-label="Sourced emblem catalog" className={styles.catalog}><h2>Emblem source library</h2><p>Internal source review. No brand is commercially authorized. Select a logo to request review.</p><div>{["toyota","honda","nissan","audi","mitsubishi","hyundai","kia"].map(id=><button key={id} onClick={()=>setBrand(id)}><img src={`/automotive-logos/${id}.svg`} alt={`${id} sourced emblem`} /><span>{id.toUpperCase()}</span><small>Inquiry only</small></button>)}</div></section><section className={styles.notes}><div><p className={styles.eyebrow}>QUIETLY CONSIDERED</p><h2>Made to carry.<br />Made to last.</h2></div><div><h3>Sculpted, not flat</h3><p>A crowned star and chamfered ring create subtle highlights. Navy lettering sits directly on the white body, with no background panels.</p></div><div><h3>A discreet signature</h3><p>Centered ZenkiLab.com on the back. Recessed by 0.48 mm with optional navy fill. The 4.5 mm keyring hole keeps a strong 3.25 mm surrounding ligament.</p></div></section>
    <footer className={styles.footer}><span>ZenkiLab.com · Custom-made in Sri Lanka</span><p>Independent custom design. Not affiliated with or endorsed by any vehicle manufacturer. This unlisted link is shareable; it is not password-protected.</p></footer>
    {zoom && <div className={styles.modal} role="dialog" aria-modal="true" aria-label="Design detail" onKeyDown={e=>{if(e.key==="Escape")closeZoom(); if(e.key==="Tab")e.preventDefault()}}><button autoFocus className={styles.close} onClick={closeZoom}>Close ×</button><div className={styles.zoomScroll}><img src={source(shape,back?"back":"mesh")} alt="Enlarged CAD-derived design" /></div><p>Pinch or scroll to inspect. Use Close to return.</p></div>}
  </main>;
}

