import type { FallbackService, Therapist } from './types';

// HARDCODED_* aliases (declared at the bottom of this file) expose the same
// arrays under semantic names for the API-backed catalog adapter. The legacy
// `services` / `rituals` / helper exports remain in place as fallbacks and
// for the parts of the app that haven't been migrated to useCatalog().
// `rituals` is gone. It duplicated the backend sub-categories one-for-one
// (a proven 8↔8 bijection) and supplied their titles, taglines, blurbs and
// FAQs — all of which are now columns on Department and arrive via /services.
// See docs/master-cuts/05-catalog-backend-driven-refactor.md.

export const services: FallbackService[] = [
  // The Atelier
  {
    id: 'atelier-signature-cut',    name: 'Signature Cut & Style',
    description: 'A precise cut tailored to your face shape, finished with a hand-blown silhouette.',
    highlights: [
      'Studied to your face & texture',
      'Dry-wet-dry cutting method',
      'Natural-bristle finish you can recreate',
    ],
    detail:
      "Every Signature Cut begins with a slow consultation: how you wear your hair on a normal Tuesday, what you wish it did, what you have stopped trying to make it do. Your therapist studies the way the hair falls, the cowlicks, the natural part. The cut is built from there — not from a reference, but from your hair's own logic.\n\nWashing happens at a reclined basin with a long scalp massage. The cut is dry, then wet, then dry again — a layered approach that catches what each state reveals. We finish with a hand-blown silhouette using only natural-bristle brushes. You leave knowing how to recreate it.",
    durationMin: 60,
    price: 350,
    image: '/assets/Images/H-03.png',
    audience: 'unisex',
  },
  {
    id: 'atelier-colour-transformation',    name: 'Colour Transformation',
    description: 'Full balayage, correction, or dimensional colour by a senior colourist.',
    highlights: [
      'Dimensional base, highlights & lowlights',
      'Complimentary consultation included',
      'Glossing treatment at close',
    ],
    detail:
      'Colour at the Atelier is treated as architecture. Our senior colourists work in dimensional layers — base, mid-tones, highlights, ribbon-thin lowlights — so the result reads as light on hair, not pigment on hair. A complimentary consultation precedes every booking so we can plan the visit, the products, and the timing honestly.\n\nExpect three to four hours in the chair. Tea, books, and a working table with charging are part of the room. We finish with a glossing treatment to seal the cuticle and a personalised home-care brief.',
    durationMin: 180,
    price: 1100,
    image: '/assets/Images/H-08.png',
    audience: 'ladies',
    requiresConsultation: true,
  },
  {
    id: 'atelier-deep-conditioning',    name: 'Deep Conditioning Treatment',
    description: 'Restorative bond-building masque, scalp massage, and silk blow-dry.',
    highlights: [
      'Bond-building masque under steam',
      '30-minute scalp massage',
      'Ionic silk-wrap blow-dry',
    ],
    detail:
      'A restorative ritual for hair under stress — heat-styled, sun-bleached, over-coloured, or just tired. We begin with a clarifying wash, follow with a bond-building masque applied in sections under steam, and close with a thirty-minute scalp massage that lingers at the temples and the base of the skull.\n\nThe blow-dry uses ionic technology and silk wraps around a cool finish. Most clients leave with hair that catches light differently for the next two weeks.',
    durationMin: 45,
    price: 280,
    image: '/assets/Images/H-09.png',
    audience: 'unisex',
  },
  {
    id: 'atelier-bridal-design',    name: 'Bridal Hair Design',
    description: 'Pre-wedding consultation, trial session, and bridal-day styling.',
    highlights: [
      'Three-visit relationship with Bridal Director',
      'Trial 2–3 weeks before your day',
      'Travels for Gulf destination weddings',
    ],
    detail:
      "Bridal hair at Ra is a three-visit relationship. The first is a long consultation with our Bridal Director — we look at your dress, your venue, your veil if you have one, and the shape of your jaw under the kind of light your photographer will be working with. The second is a full trial, two to three weeks before the day. The third is the day itself.\n\nWe travel for destination weddings across the Gulf. Anything we do at trial, we recreate with precision on the day — there are no surprises in a Ra bridal chair.",
    durationMin: 120,
    price: 1400,
    image: '/assets/Images/H-10.png',
    audience: 'ladies',
    requiresConsultation: true,
  },

  // Solar Vitality
  {
    id: 'solar-glow-facial',    name: 'Ra Glow Facial',
    description: 'Signature multi-step facial with botanical serums and lymphatic massage.',
    highlights: [
      'Botanical base with clinical-grade actives',
      'Sculpting lymphatic face & neck massage',
      'Choose 60, 75 or 90-minute variant',
    ],
    detail:
      'The Ra Glow is our signature facial — the one that defines the room. A double cleanse, a gentle enzymatic exfoliation, an extraction phase only if your skin needs it, a sculpting lymphatic massage of face and neck, a cooling masque, and a layered serum protocol. Botanical, with clinical-grade actives where they earn their place.\n\nDuration is flexible — choose 60, 75, or 90 minutes depending on how much time you can give. The 90-minute variant adds an extended scalp and shoulder ritual.',
    durationMin: 60,
    price: 540,
    image: '/assets/Images/H-04.png',
    audience: 'unisex',
    variants: [
      { id: '60', label: '60 minutes', durationMin: 60, price: 540 },
      { id: '75', label: '75 minutes', durationMin: 75, price: 650 },
      { id: '90', label: '90 minutes', durationMin: 90, price: 760 },
    ],
  },
  {
    id: 'solar-vitamin-c',    name: 'Vitamin C Brightening',
    description: 'Targets dullness and pigmentation with a high-potency vitamin C protocol.',
    highlights: [
      'Stable L-ascorbic acid serums',
      'Targets pigmentation and dullness',
      'Visible change over 3–4 sessions',
    ],
    detail:
      'Sun damage in this part of the world is cumulative and quiet — by the time you notice it, it has been there for years. Our Vitamin C Brightening protocol layers stable l-ascorbic acid serums under a vitamin C masque, with gentle exfoliation to lift surface dullness.\n\nYou will see a brightening effect immediately. The structural pigment work happens with consistency — most clients see visible change after three to four sessions over six weeks.',
    durationMin: 60,
    price: 480,
    image: '/assets/Images/H-11.png',
    audience: 'unisex',
  },
  {
    id: 'solar-led-therapy',    name: 'LED Light Therapy',
    description: 'Medical-grade LED session to calm, firm, and accelerate skin renewal.',
    highlights: [
      'Red, blue & near-infrared panels',
      '45 quiet minutes under light',
      'Layers well with other facials',
    ],
    detail:
      'Medical-grade LED with multi-wavelength panels — red light for collagen and circulation, blue light for breakouts, near-infrared for deep repair. The session itself is forty-five quiet minutes under the lights with eye protection and a calming ambient track.\n\nLED layers well with our other facials. Many clients book it as an add-on after a more active treatment to accelerate calm-down. There is no downtime; you can apply makeup the same day.',
    durationMin: 45,
    price: 380,
    image: '/assets/Images/H-12.png',
    audience: 'unisex',
  },
  {
    id: 'solar-hydration-infusion',    name: 'Hydration Infusion',
    description: 'Deep hyaluronic replenishment for dehydrated and sensitised skin.',
    highlights: [
      'Multi-weight hyaluronic layers',
      'Safe for reactive, barrier-stressed skin',
      'Travel, AC & post-procedure rescue',
    ],
    detail:
      'Built for skin that drinks and asks for more — long-haul travel, air-conditioned offices, retinoid recovery, post-procedure care. We layer multiple molecular weights of hyaluronic acid with marine peptides under a cool jelly masque.\n\nThe protocol is suitable for the most reactive skin. We avoid all actives during this session — the brief is repair and replenishment, nothing else.',
    durationMin: 60,
    price: 520,
    image: '/assets/Images/H-01.png',
    audience: 'unisex',
  },

  // Body Rituals (Massages) — Ra at Home launch catalog. Real services
  // provided by the client.
  {
    id: 'somatic-signature-massage',    name: 'Ra Signature Massage',
    description:
      'A restorative fusion of warmth, deep relief and calming holistic relaxation.',
    detail:
      'A curated wellness experience combining the flowing techniques of Balinese massage, the restorative depth of targeted pressure therapy and the calming warmth of heated stones. Enhanced by aromatic essential oils, each movement is designed to release tension, improve circulation and restore physical and emotional balance. The journey concludes with a focused scalp, neck and shoulder massage, leaving the body deeply relaxed, the mind quieted and the senses completely renewed.',
    durationMin: 90,
    price: 475,
    image: '/assets/Massage Ritual new Images/Ra Signature Massage Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/Ra Signature Massage Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/Ra Signature Massage Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
  },
  {
    id: 'somatic-deep-tissue',    name: 'The Deep Tissue Therapy',
    description:
      'Deep pressure therapy to relieve tension, restore mobility and rebalance the body.',
    detail:
      'A targeted body therapy designed to release deep muscular tension and restore physical balance. Slow, focused techniques work into areas of tightness to ease fatigue, improve circulation and support mobility. Warm therapeutic oils and concentrated pressure help relax the body while calming the mind. Gentle attention to the shoulders, neck and scalp enhances the experience, leaving you feeling lighter, restored and deeply rebalanced.',
    durationMin: 60,
    price: 320,
    image: '/assets/Massage Ritual new Images/The Deep Tissue Therapy Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/The Deep Tissue Therapy Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/The Deep Tissue Therapy Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
    variants: [
      { id: '60', label: '60 minutes', durationMin: 60, price: 320 },
      { id: '90', label: '90 minutes', durationMin: 90, price: 450 },
    ],
  },
  {
    id: 'somatic-balinese',    name: 'The Balinese Therapy',
    description:
      'A soothing Balinese massage that relieves tension, restores balance and renews energy.',
    detail:
      'A calming body therapy inspired by traditional Balinese techniques, designed to restore balance and deep relaxation. Flowing movements, rhythmic pressure and gentle stretches work together to ease muscular tension, improve circulation and quiet the mind. Aromatic oils nourish the skin while focused attention on the back, shoulders and scalp helps release accumulated stress. The experience leaves the body softened, senses restored and the mind enveloped in a lasting sense of calm and well-being.',
    durationMin: 60,
    price: 320,
    image: '/assets/Massage Ritual Images/Balinese Massage Ladies.jpg',
    imageGents: '/assets/Massage Ritual Images/Balinese Massage Men.jpg',
    imageLadies: '/assets/Massage Ritual Images/Balinese Massage Ladies.jpg',
    audience: 'unisex',
    location: 'both',
    variants: [
      { id: '60', label: '60 minutes', durationMin: 60, price: 320 },
      { id: '90', label: '90 minutes', durationMin: 90, price: 450 },
    ],
  },
  {
    id: 'somatic-swedish',    name: 'The Soft Serenity Massage',
    description:
      'A Swedish massage designed to ease tension, restore balance and relax the body.',
    detail:
      'Experience deep relaxation with our Swedish Massage, a timeless therapy designed to ease muscle tension, improve circulation and calm the mind. Using gentle to medium pressure techniques combined with smooth, flowing strokes, this treatment helps reduce stress, relieve body fatigue and restore overall balance. Perfect for those seeking relaxation and wellness, this massage promotes a sense of lightness, comfort and renewed energy, leaving your body refreshed and the mind free of tensions.',
    durationMin: 60,
    price: 305,
    image: '/assets/Massage Ritual new Images/The Soft Serenity Massage Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/The Soft Serenity Massage Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/The Soft Serenity Massage Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
    variants: [
      { id: '60', label: '60 minutes', durationMin: 60, price: 305 },
      { id: '90', label: '90 minutes', durationMin: 90, price: 415 },
    ],
  },
  {
    id: 'somatic-sensory',    name: 'The Sensory Body Therapy',
    description:
      'Rebalance with a deeply calming massage using custom oils and rhythmic touch.',
    detail:
      'Experience the ultimate sensory body massage, a curated journey designed to restore emotional and physical harmony. Custom-blended essential oils are chosen to calm, uplift or restore, while flowing rhythmic techniques and gentle pressure quiet the mind and dissolve tension. With focused attention on the shoulders, neck and scalp, this treatment softens the body and fosters deep relaxation. Leave with a lighter mind, a soothed body and a lasting sense of well-being.',
    durationMin: 60,
    price: 360,
    image: '/assets/Massage Ritual new Images/The Sensory Body Therapy Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/The Sensory Body Therapy Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/The Sensory Body Therapy Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
    variants: [
      { id: '60', label: '60 minutes', durationMin: 60, price: 360 },
      { id: '90', label: '90 minutes', durationMin: 90, price: 510 },
    ],
  },
  {
    id: 'somatic-scalp',    name: 'Ra Serenity Scalp Therapy',
    description:
      'Nourishing scalp oil therapy with shoulder massage for deep relaxation and calm.',
    detail:
      'A deeply restorative scalp experience designed to calm the mind and release built-up tension. Nourishing oils are applied using slow, rhythmic techniques that stimulate circulation while conditioning the scalp. The experience extends into a focused shoulder and neck massage, easing tightness and encouraging a sense of lightness throughout the upper body. Gentle pressure-point techniques enhance relaxation, creating a quiet moment of reset. The result is a nourished scalp, softened hair and a profound sense of calm and restoration.',
    durationMin: 45,
    price: 230,
    image: '/assets/Massage Ritual new Images/Ra Serenity Scalp Therapy Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/Ra Serenity Scalp Therapy Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/Ra Serenity Scalp Therapy Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
  },
  // Add-on enhancements — NOT independently bookable. Surface in the cart only
  // once a parent massage (ritual 'somatic-recovery') is present.
  {
    id: 'somatic-hotstone',    name: 'Hot Stone Enhancement',
    description:
      'Heated stones ease tension, relax muscles and deepen your massage experience.',
    detail:
      'A 20-minute thermal enhancement designed to complement your Deep Tissue Therapy, Balinese Therapy, Soft Serenity Massage or Sensory Body Therapy. Smooth heated stones are applied with slow, flowing movements across targeted areas of the body, allowing warmth to penetrate deeply into the muscles. This calming addition helps improve circulation, soften tension and elevate the overall massage experience, leaving the body feeling lighter, soothed and deeply relaxed.',
    durationMin: 20,
    price: 60,
    // Reuses the Soft Serenity imagery per client direction (no bespoke
    // Hot Stone shot). Tracks the Soft Serenity files, so it updates when
    // those are refreshed.
    image: '/assets/Massage Ritual new Images/The Soft Serenity Massage Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/The Soft Serenity Massage Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/The Soft Serenity Massage Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
    addOn: true,
  },
  {
    id: 'somatic-cupping',    name: 'Cupping Enhancement',
    description:
      'Targeted cupping therapy to release tension and support muscle recovery.',
    detail:
      'A targeted add-on designed to release deep muscle tension and improve circulation. Gentle suction techniques help stimulate recovery, reduce tightness and support overall body balance. Integrated into your massage experience, this enhancement leaves the body feeling lighter, restored and deeply relieved.',
    durationMin: 15,
    price: 60,
    image: '/assets/Massage Ritual new Images/Cupping Enhancement Ladies.jpeg',
    imageGents: '/assets/Massage Ritual new Images/Cupping Enhancement Gents.jpeg',
    imageLadies: '/assets/Massage Ritual new Images/Cupping Enhancement Ladies.jpeg',
    audience: 'unisex',
    location: 'both',
    addOn: true,
  },
  // Signature Rituals — the awareness ritual; a 45-minute Ra introduction.
  // ID prefix 'signature-' is matched by the Signature group in AtHomePage.
  {
    id: 'signature-intro-45',    name: 'Ra Signature Introduction',
    description:
      'A 45-minute introduction to the essence of Ra — aromatherapy, focused deep tissue and warmed stones.',
    detail:
      'A 45-minute introduction to the essence of Ra. Aromatherapy, focused deep tissue work and warmed stones come together in a mindfully choreographed experience designed to relax, restore and rejuvenate.',
    highlights: [
      '45 mindfully choreographed minutes',
      'Aromatherapy with warmed stones',
      'Focused deep tissue work',
    ],
    durationMin: 45,
    price: 285,
    image: '/assets/Massage Ritual Images/Ra signature introduction Ladies.jpg',
    imageGents: '/assets/Massage Ritual Images/Ra signature introduction Men.jpg',
    imageLadies: '/assets/Massage Ritual Images/Ra signature introduction Ladies.jpg',
    audience: 'unisex',
    location: 'home',
  },

  // Alchemic Aesthetics
  {
    id: 'alchemic-gel-manicure',    name: 'Gel Manicure',
    description: 'Long-wear gel manicure with cuticle ritual and hand massage.',
    highlights: [
      'Cuticle-first, soak-off method',
      'Clean-formula gels, no toxic ten',
      '2–3 weeks of high-shine wear',
    ],
    detail:
      "A precise gel manicure begins with the cuticle, not the nail plate. We push, never cut, and we soak rather than drill. The shaping is done by hand. Two coats of gel, cured under low-heat LED, finished with a high-shine top coat that holds for two to three weeks.\n\nWe carry a curated palette of clean-formula gels — every polish in the room is free of the most common ten compounds plus formaldehyde and toluene.",
    durationMin: 60,
    price: 220,
    image: '/assets/Images/H-06.png',
    audience: 'unisex',
    location: 'salon',
  },
  {
    id: 'alchemic-luxury-pedicure',    name: 'Luxury Pedicure',
    description: 'Foot soak, exfoliation, callus care, and polish with a calf massage.',
    highlights: [
      'Mineral-salt soak in a copper basin',
      'Hand-tool callus care, no electric files',
      'Warming calf & foot massage',
    ],
    detail:
      'Begins with a long mineral-salt foot soak in a copper basin, followed by exfoliation, gentle callus care with hand tools (no electric files), and meticulous nail and cuticle work. Closes with a calf and foot massage using a warming oil blend, and your choice of regular or gel polish.\n\nThe whole experience is unhurried — most clients book it as the kind of break the day was missing.',
    durationMin: 75,
    price: 280,
    image: '/assets/Images/H-08.png',
    audience: 'unisex',
    location: 'salon',
  },
  {
    id: 'alchemic-nail-art',    name: 'Nail Art & Design',
    description: 'Considered hand-painted or encapsulated nail art by a resident artist.',
    highlights: [
      'Hand-painted by a resident artist',
      'Adapts references to your nail shape',
      'Encapsulated & fine-line detail',
    ],
    detail:
      "Our resident nail artists work with hand-painted detail, encapsulated florals, fine line work, chrome, and the kind of subtle texture that reads as art when you look closely. Bring a reference if you have one — we will adapt it to your nail length, shape, and the art's place on the hand.\n\nAllow ninety minutes for full sets; longer for elaborate concepts. Worth booking ahead.",
    durationMin: 90,
    price: 360,
    image: '/assets/Images/H-09.png',
    audience: 'ladies',
    location: 'salon',
  },
  {
    id: 'alchemic-paraffin',    name: 'Paraffin Treatment',
    description: 'Warm paraffin wax therapy for deeply softened hands or feet.',
    highlights: [
      'Deeply softens dehydrated skin',
      'Warm wax & cotton-mitt wraps',
      'Pairs beautifully with a mani or pedi',
    ],
    detail:
      'A warming, deeply softening treatment for hands or feet — thirty quiet minutes wrapped in warmed paraffin and cotton mitts. Best paired with a manicure or pedicure as an add-on, or booked alone after a long flight.\n\nThe results are most dramatic on dehydrated skin or hands that have been working hard.',
    durationMin: 30,
    price: 180,
    image: '/assets/Images/H-10.png',
    audience: 'unisex',
    location: 'salon',
  },

  // The Longevity Lab
  {
    id: 'longevity-iv-drip',    name: 'IV Drip Therapy',
    description: 'Tailored vitamin and antioxidant infusion administered by a medical team.',
    highlights: [
      'Formulated by in-house medical team',
      'Private, comfortable infusion suite',
      'Medical consultation on first visit',
    ],
    detail:
      'Our IV protocols are formulated by an in-house medical team and administered in a private, comfortable suite. The most common formulations are immune support, recovery and rehydration, performance and energy, and a brightening glow blend rich in glutathione.\n\nA medical consultation precedes every first IV — we review history, current medications, and goals before recommending a protocol.',
    durationMin: 45,
    price: 750,
    image: '/assets/Images/H-07.png',
    audience: 'unisex',
    requiresConsultation: true,
  },
  {
    id: 'longevity-cryotherapy',    name: 'Cryotherapy',
    description: 'Whole-body cold exposure to support recovery, mood, and inflammation.',
    highlights: [
      'Three-minute whole-body session',
      'Supports recovery, mood & circulation',
      'Full screening for contraindications',
    ],
    detail:
      'Three minutes in a whole-body cryo chamber at minus 110°C. The session itself is brief — the work happens in the hours after, as the body responds with a controlled inflammatory cascade that supports recovery, mood, and circulation.\n\nWe screen for contraindications at booking. Not suitable in pregnancy, with cardiovascular conditions, or with certain skin disorders.',
    durationMin: 15,
    price: 320,
    image: '/assets/Images/H-11.png',
    audience: 'unisex',
  },
  {
    id: 'longevity-biomarker',    name: 'Biomarker Assessment',
    description: 'Comprehensive blood panel and lifestyle review with a longevity specialist.',
    highlights: [
      'Full metabolic & hormonal panel',
      '30-min review with longevity specialist',
      'Written plan with actionable priorities',
    ],
    detail:
      'A comprehensive panel — metabolic, hormonal, inflammatory, micronutrient, and lipid markers — combined with a thirty-minute consultation with our longevity specialist. The output is a clear written report with a small set of priorities you can actually act on.\n\nFast for eight to twelve hours before your visit. Water is fine. Bring a list of supplements and medications.',
    durationMin: 30,
    price: 850,
    image: '/assets/Images/H-12.png',
    audience: 'unisex',
    requiresConsultation: true,
  },
  {
    id: 'longevity-anti-ageing-facial',    name: 'Anti-Ageing Facial',
    description: 'Peptide-rich protocol with microcurrent lift and sculpting massage.',
    highlights: [
      'Microcurrent lift with peptide serums',
      'Sculpting deep-structure massage',
      'Red-light LED finish',
    ],
    detail:
      'A clinical facial built around microcurrent — the gentle electrical stimulation of facial muscles for a visible lifting effect. Combined with a peptide-rich serum protocol, sculpting massage of the deeper facial structures, and a red-light LED finish.\n\nThe lift is immediate but builds with consistency. Most clients book a series of six over six weeks for the strongest results, then maintain monthly.',
    durationMin: 75,
    price: 950,
    image: '/assets/Images/H-04.png',
    audience: 'unisex',
  },

  // Velvet Smooth
  {
    id: 'velvet-full-leg',    name: 'Full Leg Wax',
    description: 'Complete leg waxing with warm wax and calming post-care balm.',
    highlights: [
      'Low-temperature warm wax',
      'Cooling aloe-chamomile finish',
      'Worked methodically, section by section',
    ],
    detail:
      'A full-leg ritual from ankle to thigh. We use a low-temperature warm wax for even lift and minimal redness, finished with a cooling aloe-and-chamomile balm to calm the skin.\n\nAllow sixty minutes for your first visit — the sections are worked methodically, with short pauses for hydration and skin checks. Regular clients find subsequent visits move a little faster as the hair cycle softens.',
    durationMin: 60,
    price: 220,
    image: '/assets/Images/H-01.png',
    audience: 'ladies',
  },
  {
    id: 'velvet-brazilian',    name: 'Brazilian Wax',
    description: 'Precise, hygienic intimate waxing by a specialist therapist.',
    highlights: [
      'Performed in a private suite',
      'Hard wax for sensitive-area comfort',
      'Aftercare brief on first visit',
    ],
    detail:
      'A specialist service performed in a private suite by a senior therapist trained specifically in intimate waxing. We use hard wax, which grips the hair and releases the skin, for the most comfortable finish possible in a sensitive area.\n\nFirst visits include a short consultation on aftercare, ingrown prevention, and the rhythm that will keep each subsequent visit gentler on the skin.',
    durationMin: 45,
    price: 260,
    image: '/assets/Images/H-02.png',
    audience: 'ladies',
  },
  {
    id: 'velvet-underarm',    name: 'Underarm Wax',
    description: 'Quick, precise underarm waxing with skin-calming finish.',
    highlights: [
      'In-and-out in twenty minutes',
      'Hard wax for a comfortable lift',
      'Cooling balm to settle skin',
    ],
    detail:
      'A fast, precise service — in and out in twenty minutes. We use hard wax for the most comfortable lift, and finish with a calming balm that helps the skin settle quickly. Best booked at the end of a longer visit or on its own as a quick reset.',
    durationMin: 20,
    price: 90,
    image: '/assets/Images/H-09.png',
    audience: 'unisex',
  },
  {
    id: 'velvet-mens-back-chest',    name: "Men's Back & Chest Wax",
    description: 'Thorough back and chest waxing in a private suite.',
    highlights: [
      'Private suite, male therapist on request',
      'Hard & soft wax chosen by area',
      'Cooling balm finish',
    ],
    detail:
      'A dedicated session for the back and chest, performed in a private suite by a male therapist where requested. We work in sections with hard wax for the densest areas and soft wax for the softer planes, finishing with a cooling balm.\n\nAllow forty-five minutes. First visits may take a little longer while we read the growth pattern and plan the rhythm for future appointments.',
    durationMin: 45,
    price: 320,
    image: '/assets/Images/H-10.png',
    audience: 'gentlemen',
  },
  {
    id: 'velvet-threading-brows',    name: 'Eyebrow Threading',
    description: 'Precise brow shaping using ancient cotton-thread technique.',
    highlights: [
      'Cotton thread, no wax or pulling',
      'Reads the brow’s natural arch',
      'Gentle on sensitive skin',
    ],
    detail:
      'A heritage technique that uses a twisted cotton thread to lift each hair from the root, line by line. The shaping reads your natural arch and the angle of the bone beneath, lifting strays and refining the line without the heat or pull of wax.\n\nQuick, precise, and ideal for sensitive skin. Available at the salon and at home.',
    durationMin: 20,
    price: 60,
    image: '/assets/Images/H-06.png',
    audience: 'ladies',
    location: 'salon',
  },
  {
    id: 'velvet-threading-lip',    name: 'Upper Lip Threading',
    description: 'Fast, precise upper-lip hair removal by thread.',
    highlights: [
      'Under ten minutes',
      'No heat, no chemicals',
      'Calming aloe finish',
    ],
    detail:
      'A short, precise service to lift fine upper-lip hair using cotton thread. Closes with a calming aloe touch. Pairs naturally with an eyebrow thread or a manicure.',
    durationMin: 10,
    price: 30,
    image: '/assets/Images/H-07.png',
    audience: 'ladies',
    location: 'salon',
  },
  {
    id: 'velvet-threading-face',    name: 'Full Face Threading',
    description: 'Complete facial hair removal — cheeks, chin, brows, lip.',
    highlights: [
      'Brows, lip, chin, cheeks & sideburns',
      'Even, glow-revealing finish',
      'Followed by a cooling rosewater mist',
    ],
    detail:
      'A full-face threading session covering brows, upper lip, chin, cheeks, and sideburns. The result is a more even skin tone and a finish that catches light cleanly under makeup or on bare skin.\n\nWe close with a cooling rosewater mist. Allow thirty minutes.',
    durationMin: 30,
    price: 120,
    image: '/assets/Images/H-08.png',
    audience: 'ladies',
    location: 'salon',
  },

  // Body Renewal
  {
    id: 'renewal-day-makeup',    name: 'Day Makeup',
    description: 'A luminous, lived-in look tailored to your day and your light.',
    highlights: [
      "Tailored to your day's lighting",
      'Clean-formula base, pigment where needed',
      'Photographed so you can recreate at home',
    ],
    detail:
      'A sixty-minute session for an everyday-beautiful finish — light base, warmed cheek, softly defined eye, groomed brow, a lip that suits the day. We begin with a short conversation about where you are going, and tailor the look to the lighting you will be in.\n\nClean-formula base by default, pigment-rich finish on request. We photograph the final look from two angles so you can recreate key steps at home.',
    durationMin: 60,
    price: 280,
    image: '/assets/Images/H-12.png',
    audience: 'ladies',
  },
  {
    id: 'renewal-bridal-makeup',    name: 'Bridal Makeup',
    description: 'Pre-wedding trial and bridal-day makeup by a senior artist.',
    highlights: [
      'Two-visit relationship: trial + day',
      'Senior artist on every booking',
      'Travels for Gulf destination weddings',
    ],
    detail:
      'Bridal makeup at Ra is a two-visit relationship. The first is a full trial, two to three weeks before the wedding, where we design the look against your dress, veil, and skin on the day. The second is the morning of the wedding itself — every product from the trial is recreated, step for step, under the light you will actually be in.\n\nWe travel for destination weddings across the Gulf. Every booking is with our senior artist; no hand-off on the day.',
    durationMin: 120,
    price: 900,
    image: '/assets/Images/H-10.png',
    audience: 'ladies',
    requiresConsultation: true,
  },
  {
    id: 'renewal-editorial',    name: 'Editorial & Event',
    description: 'Camera-ready makeup for shoots, events, and occasions.',
    highlights: [
      'Sculptural for camera & galas',
      'Contour, pigment & lash work',
      'Holds under event-length lighting',
    ],
    detail:
      'A ninety-minute session for stronger, more sculptural looks — editorial shoots, events, galas, moments where the camera will matter. We work with contour and highlight, pigment intensity, lash work, and bolder lip choices.\n\nClients often bring a brief or reference board. We read it with you, then propose the version that will hold under your lighting.',
    durationMin: 90,
    price: 550,
    image: '/assets/Images/H-08.png',
    audience: 'ladies',
  },
  {
    id: 'renewal-grooming-brows',    name: 'Brow Grooming & Tint',
    description: 'Precise shaping with optional tint, for soft or defined brows.',
    highlights: [
      'Mapped to your face shape',
      'Wax + tweezer shaping',
      'Optional tint for soft definition',
    ],
    detail:
      'A thirty-minute session focused on the brow — mapped to your face, shaped with wax and tweezers, and finished with an optional tint for a soft or more defined finish. The shape is the priority; tint is only added where it reads naturally.',
    durationMin: 30,
    price: 120,
    image: '/assets/Images/H-11.png',
    audience: 'unisex',
  },
];

// Named roster is intentionally empty — every service falls back to
// "Any available (recommended)" in the therapist picker. Names + designation +
// service-tag (via ritualIds) only, no images or bios, if a roster is ever
// reinstated (inclusive, non-promotional presentation).
export const therapists: Therapist[] = [];

/** Shape of the retired bundled journeys. See `packages` below. */
interface BundledJourney {
  id: string;
  name: string;
  tagline: string;
  category: string;
  description: string;
  longDescription: string;
  philosophy: string;
  image: string;
  serviceIds: string[];
  savings: number;
}

/**
 * The five original hardcoded Journeys.
 *
 * DEAD as of Phase 6.6 — packages are served by the backend and nothing
 * imports these any more. They are retained only as the reference copy the
 * migration was built from, and are deleted in Phase 6.7.
 *
 * Deliberately NOT typed as `Package`: that interface now carries
 * backend-derived pricing (price, durationMin, originalPrice, savingsAmount,
 * items, incomplete) which a bundled literal cannot supply.
 */
export const packages: BundledJourney[] = [
  {
    id: 'bridal-day',
    name: 'The Bridal Bloom',
    tagline: 'A full-day ceremony for the bride',
    category: 'Life Moment',
    description:
      'A curated bridal journey designed to illuminate, restore, and celebrate the bride in the days before her day.',
    longDescription:
      'The Bridal Bloom is the ceremony before the ceremony — a full day reserved for the bride, built around the idea that calm travels through the aisle more reliably than anything else we can offer. Your morning begins in the private suite with tea and a breathing ritual. From there, the day unfolds at the unhurried pace your wedding week will not.\n\nThe journey weaves together four of our most precise rituals: bridal hair design with our Bridal Director, a luminous Ra Glow facial to prepare the skin for the lights of your day, and a complete mani-pedi ritual in the clean-formula room. The sequencing matters — we schedule each service with rest between, so by the time you leave, you carry both the work and the stillness with you.',
    philosophy: 'The ceremony before the ceremony.',
    image: '/assets/Images/H-10.png',
    serviceIds: [
      'atelier-bridal-design',
      'solar-glow-facial',
      'alchemic-luxury-pedicure',
      'alchemic-gel-manicure',
    ],
    savings: 15,
  },
  {
    id: 'recovery-reset',
    name: 'Soul Sunday',
    tagline: 'Restore, rehydrate, release',
    category: 'Half-Day Retreat',
    description:
      'A full morning of restoration — beginning with signature massage and ending with deep hydration.',
    longDescription:
      'Soul Sunday is built for the kind of week that asks too much. A full morning reserved for doing less: a long signature massage that reads the week out of your shoulders, followed by LED light therapy to calm what the week inflamed, closing with a hydration facial that gives the skin back what air-conditioning and screens have taken.\n\nThe pacing is deliberate. A short rest in the suite between services, tea between rooms, and a close that leaves you slower than when you arrived. Most clients book this the Sunday before a difficult Monday.',
    philosophy: 'Slower out than in.',
    image: '/assets/Images/H-08.png',
    serviceIds: ['somatic-signature-massage', 'solar-led-therapy', 'solar-hydration-infusion'],
    savings: 10,
  },
  {
    id: 'longevity-immersion',
    name: 'The Longevity Immersion',
    tagline: 'A clinical deep-dive into vitality',
    category: 'Clinical Journey',
    description:
      'IV drip therapy, cryotherapy, and a full biomarker assessment in a single, clinical visit.',
    longDescription:
      'The Longevity Immersion is the clinical floor of Mastercuts in a single sitting. A biomarker panel taken first, reviewed with our longevity specialist. A tailored IV protocol drawn from your goals. A cryotherapy session to close. The visit is long — three hours of clinical attention — and the output is quiet: a written plan, a starting set of numbers, and a recommendation you can actually act on.\n\nThis is for people thinking in years, not days. Best suited to a first visit when you want measurable ground under your next quarter.',
    philosophy: 'Measured, patient, informed.',
    image: '/assets/Images/H-07.png',
    serviceIds: ['longevity-iv-drip', 'longevity-cryotherapy', 'longevity-biomarker'],
    savings: 12,
  },
  {
    id: 'full-ra',
    name: 'The Khaleeji Heritage Journey',
    tagline: 'A half-day of Mastercuts, end to end',
    category: 'Cultural Ritual',
    description:
      'Inspired by the ancient beauty customs of the Gulf — a Ra signature from hair to skin to touch.',
    longDescription:
      "The Khaleeji Heritage Journey draws on the region's oldest beauty rituals — oud, saffron, black seed, rose — and threads them through four of our signature rooms. A signature cut and style, a deep hydration facial scented with Gulf botanicals, a gel manicure in a heritage palette, and a restorative massage with warm oil.\n\nThe four rooms are sequenced so the day flows as a single arc: sensory attention at every hand-off, tea in between, and a calm that builds through the afternoon.",
    philosophy: 'Heritage, carefully kept.',
    image: '/assets/Images/H-09.png',
    serviceIds: [
      'atelier-signature-cut',
      'solar-hydration-infusion',
      'alchemic-gel-manicure',
      'somatic-signature-massage',
    ],
    savings: 15,
  },
  {
    id: 'colour-and-glow',
    name: 'Colour & Glow',
    tagline: 'Radiance from root to skin',
    category: 'Radiance Journey',
    description:
      'Colour transformation, a brightening facial, and a bond-building conditioning ritual in one arc.',
    longDescription:
      "Colour & Glow is for a season when you want light — in the hair and in the skin. A dimensional colour transformation with one of our senior colourists lays the base. A Vitamin C brightening facial follows, to meet the hair's new read of light. A bond-building conditioning ritual closes the day so the colour holds and the cuticle stays sealed.\n\nThe three rituals are calibrated to each other — the facial avoids the roots while the colour sets, the conditioning ritual sits last so the blow-out is fresh when you leave.",
    philosophy: 'Light meets light.',
    image: '/assets/Images/H-08.png',
    serviceIds: [
      'atelier-colour-transformation',
      'solar-vitamin-c',
      'atelier-deep-conditioning',
    ],
    savings: 12,
  },
];

export function getService(id: string): FallbackService | undefined {
  return services.find((s) => s.id === id);
}

export function getTherapist(id: string): Therapist | undefined {
  return therapists.find((s) => s.id === id);
}

// `getRitual`, `getTherapistsForRitual`, `getServicesForRitual`,
// `getAtHomeServices` and `getPackagesForRitual` are gone. Grouping and
// at-home eligibility are backend facts now — `CatalogProvider.getSections` /
// `getSectionServices` read them from /services. These module-level copies
// filtered the BUNDLED array, so they could only ever have gone stale.

// Journeys are packages in the richer, storytelling framing.
export const journeys = packages;

export function getJourney(id: string): BundledJourney | undefined {
  return packages.find((p) => p.id === id);
}

export interface JourneyTotals {
  totalDuration: number;
  totalPriceFull: number;
  totalPriceDiscounted: number;
  savingsAed: number;
}

// `getFrequentlyAddedSuggestions` and `getAddOnSuggestions` lived here but
// filtered the BUNDLED array. CatalogProvider re-implements both against the
// API-derived catalog; these copies were referenced only by a `void` and their
// ritual-based grouping no longer had anything to group on.



export function getJourneyTotals(journey: BundledJourney): JourneyTotals {
  const resolved = journey.serviceIds
    .map(getService)
    .filter(Boolean) as FallbackService[];
  const totalDuration = resolved.reduce((s, svc) => s + svc.durationMin, 0);
  const totalPriceFull = resolved.reduce((s, svc) => s + svc.price, 0);
  const totalPriceDiscounted = Math.round(totalPriceFull * (1 - journey.savings / 100));
  return {
    totalDuration,
    totalPriceFull,
    totalPriceDiscounted,
    savingsAed: totalPriceFull - totalPriceDiscounted,
  };
}

// --- API-catalog interop aliases ---------------------------------------
// Same data, semantic names. catalogAdapter.ts reads from these so the
// "what's hardcoded" intent is explicit at the import site.
export const HARDCODED_SERVICES = services;
export const HARDCODED_THERAPISTS = therapists;
export const HARDCODED_PACKAGES = packages;
