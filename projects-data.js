/* ==========================================================================
   Jeoffrey Sherren Sarmiento - Portfolio
   Case study data for the Work section preview modal.

   Visible card content (badge, category, summary, results, stack) lives in
   index.html so it stays crawlable without JS. This file only holds the
   deeper fields shown once someone opens a case study: Overview, Challenge,
   Solution, Role, Duration, and Highlights, plus the two outbound links.

   NOTE: Duration and Role are best-effort placeholders. Replace with your
   actual timelines before this goes live.
   ========================================================================== */

var PROJECTS_DATA = {

  "jersa-erp": {
    overview: "JERSA ERP is a self-initiated enterprise software build: a workforce and business management platform for a fictional trading company, covering HR, payroll, inventory, and point-of-sale in one system.",
    challenge: "Most portfolio \"enterprise\" projects are a single dashboard with fake numbers. The goal was to prove the difference. Role-based access, real computed payroll math, live data mutation, and an interface dense enough to actually run a business day to day, with no backend to lean on.",
    solution: "Built module by module, with one rule: nothing ships to the navigation until it fully works. A hash-routed vanilla JavaScript app with two distinct experiences, a dense admin console and a calm employee portal, sharing one design-token system and a LocalStorage data layer built to be swapped for a real database later without touching the UI.",
    role: "Solo: architecture, design system, and development",
    duration: "In progress, shipped module by module",
    highlights: ["Two fully distinct role-based interfaces", "Real Philippine payroll math (SSS, PhilHealth, Pag-IBIG, tax)", "Zero dependencies beyond Chart.js", "Deployed as a static site, no backend required"],
    liveUrl: "https://yendevs.github.io/JersaERP/",
    sourceUrl: "https://github.com/yendevs/JersaERP"
  },

  "ib": {
    overview: "An e-commerce rebuild for a beauty and self-care brand that was losing customers to a browsing-only catalog page with no way to check out.",
    challenge: "Visitors could see products but had to message the page directly to order. Slow, easy to drop off, and impossible to scale past a handful of orders a day.",
    solution: "Built a full catalog, cart, and checkout flow front to back, with product organization that matches how customers actually shop and a payment path that doesn't add friction at the last step.",
    role: "Freelance: design and full-stack development",
    duration: "About 4 weeks",
    highlights: ["Full catalog, cart, and checkout", "Mobile-first product browsing", "Built for repeat-customer traffic"],
    liveUrl: "https://infinitebeautyraquel.com/",
    sourceUrl: ""
  },

  "spira": {
    overview: "A corporate site for the Philippine distributor of TOTO bathroom fixtures, built for contractors and developers doing product research, not casual browsers.",
    challenge: "The existing materials were catalog PDFs and price sheets. Nothing a contractor could search or reference on-site, and nothing that reflected the brand's actual scale.",
    solution: "Structured the site around how trade buyers actually evaluate suppliers: product categories, specification detail, and a direct inquiry path, instead of a generic \"about us\" layout.",
    role: "Freelance: design and development",
    duration: "About 5 weeks",
    highlights: ["Full product category structure", "Built for trade and B2B buyers", "Inquiry-first layout"],
    liveUrl: "https://www.spirasalescorp.com/home",
    sourceUrl: ""
  },

  "merak": {
    overview: "A brand site for a therapy and alternative healing practice, where the existing web presence didn't match the calm, trust-first experience of the actual space.",
    challenge: "Wellness and therapy sites default to either sterile-clinical or overly decorative. Neither reads as trustworthy to someone looking for care.",
    solution: "Built a layout that stays calm rather than corporate: generous spacing, service explanations that don't oversell, and a booking path that doesn't feel transactional.",
    role: "Freelance: design and development",
    duration: "About 3 weeks",
    highlights: ["Calm, trust-first layout", "Service pages written for first-time visitors", "Mobile-first booking path"],
    liveUrl: "https://merakwellnesscenter.com/",
    sourceUrl: ""
  },

  "mfs": {
    overview: "A healthcare site for a maternal-fetal medicine practice, built to organize dense clinical content so a worried parent can actually find what they need.",
    challenge: "Maternal-fetal medicine covers a lot of ground: conditions, procedures, what-to-expect content. Most of it needed to stay accurate and easy to scan under stress, not simplified into vagueness.",
    solution: "Organized the content hierarchy around patient questions first, condition detail second, with clear navigation so specific information is never more than two clicks from the homepage.",
    role: "Freelance: design and development",
    duration: "About 4 weeks",
    highlights: ["Dense clinical content, organized for anxious readers", "Clear information hierarchy", "Accessible, scannable layout"],
    liveUrl: "https://mfsofva.com/",
    sourceUrl: ""
  },

  "brightsmile": {
    overview: "A Webflow build for a dental practice, structured around getting visitors to book an appointment rather than just read about services.",
    challenge: "Dental sites tend to read as a services brochure. Informative, but with no clear next step for someone ready to book.",
    solution: "Built the layout around a single primary action, booking, with service information supporting that goal instead of competing with it.",
    role: "Freelance: design and Webflow build",
    duration: "About 2 weeks",
    highlights: ["Booking-first layout", "Built entirely in Webflow", "Mobile-optimized service pages"],
    liveUrl: "https://webflow.com/design/brightsmile-dental-d26054?utm_medium=project_link&utm_source=designer&utm_content=brightsmile-dental-d26054",
    sourceUrl: ""
  },

  "coachkai": {
    overview: "A Webflow build for a fitness coaching brand that needed a louder, higher-energy presence than a typical service site.",
    challenge: "The brief explicitly called for energy and personality. A template-feeling fitness site would have undersold the coach's actual brand.",
    solution: "Leaned into bold typography and a higher-contrast layout than the rest of this portfolio's work, while keeping the booking and contact paths just as clear.",
    role: "Freelance: design and Webflow build",
    duration: "About 2 weeks",
    highlights: ["High-energy visual direction", "Built entirely in Webflow", "Clear booking and contact paths"],
    liveUrl: "https://webflow.com/design/coachkai-fitness?utm_medium=project_link&utm_source=designer&utm_content=coachkai-fitness",
    sourceUrl: ""
  },

  "lavish": {
    overview: "A landing page for a skincare and body-contouring clinic, built to explain services quickly and get the inquiry form seen.",
    challenge: "The clinic offers several distinct treatment services, and needed a single page that could explain all of them without overwhelming a first-time visitor.",
    solution: "Prioritized a clear service breakdown above the fold, with trust signals and the inquiry form placed where someone is actually ready to act.",
    role: "Freelance: design and development",
    duration: "About 1 to 2 weeks",
    highlights: ["Single-page service breakdown", "Trust-focused layout", "Fast-loading, mobile-first build"],
    liveUrl: "https://lavishrejuvenations.com/",
    sourceUrl: ""
  },

  "sparkclean": {
    overview: "A static demo built to test a booking-first layout for a cleaning service before the client committed to a full build.",
    challenge: "The client wanted to see the direction before investing in a full site. A working proof of concept mattered more than backend functionality at this stage.",
    solution: "Built a static front-end demo with the full intended layout and booking flow, so the direction could be reviewed and approved before development continued.",
    role: "Freelance: design and front-end development",
    duration: "About 1 week",
    highlights: ["Proof-of-concept before full build", "Booking-first layout", "Static, fast-loading demo"],
    liveUrl: "https://jeoffnocaps.github.io/sparkclean-demo/",
    sourceUrl: ""
  },

  "borrower-system": {
    overview: "A PHP and MySQL system built during my internship at T.I.P. ITSO to replace manual equipment borrower logs.",
    challenge: "Equipment lending was tracked on paper. Slow to search, easy to lose, and with no automatic way to flag overdue returns.",
    solution: "Built a database-backed system covering equipment borrowing, inventory monitoring, automatic overdue notifications, and printable borrower slips for the lab staff.",
    role: "IT Intern: development",
    duration: "Internship project",
    highlights: ["Equipment borrowing and inventory tracking", "Automatic overdue notifications", "Printable borrower slips"],
    liveUrl: "",
    sourceUrl: ""
  },

  "pottery-capstone": {
    overview: "A VR pottery education game built in Unity for my capstone, covering carving, painting, and kiln stages of the pottery process.",
    challenge: "Teaching a physical, tactile craft through VR needed more than a 3D model to interact with. It needed a structure that could actually teach and evaluate the skill.",
    solution: "Led development of a tutorial mode, a quest mode, and a grading and feedback system, so the experience could function as an actual teaching tool, not just a demo.",
    role: "Lead Developer: technical integration",
    duration: "Capstone project",
    highlights: ["Tutorial and quest mode", "Carving, painting, and kiln stages", "Grading and feedback system"],
    liveUrl: "",
    sourceUrl: ""
  },

  // TODO(jeoff): fill in real challenge/solution detail, role, duration,
  // and highlights once confirmed. liveUrl/sourceUrl left empty (same
  // pattern as borrower-system and pottery-capstone above) rather than a
  // "#" placeholder link, so no dead button renders in the modal until
  // there is a real one to point to. Status shown as "in progress" on the
  // table row until you confirm otherwise.
  "sabakva": {
    overview: "SabakVa is a free training program for beginner developers, built in Flutter and Supabase to give people starting out a real project to learn from and build on.",
    challenge: "Most free resources for beginner developers stop at isolated tutorials. SabakVa's goal was a real, working program built with the same tools and structure as a production app.",
    solution: "Built with Flutter and Supabase, the same stack behind PawCare Pro, kept free and open so beginners have a real project to study and extend.",
    role: "Solo: design and development",
    duration: "In progress",
    gallery: [
      { src: "./assets/sabakva/sabakva-courses.jpg", caption: "Ten VA training tracks, from General VA through specialized paths like Real Estate and Bookkeeping." },
      { src: "./assets/sabakva/sabakva-course-detail.jpg", caption: "Each track breaks into modules with real lesson and quiz progress tracking." }
    ],
    highlights: ["Free and open to beginner developers", "Built in Flutter and Supabase", "Self-initiated, in progress"],
    liveUrl: "",
    sourceUrl: ""
  },

  "pawcare-pro": {
    overview: "PawCare Pro is a full clinic management system for veterinary practices, built in Flutter and Supabase: medical records, point-of-sale billing, inventory, confinement and boarding, a client-facing portal, and role-based access for admin, vet, and reception staff.",
    challenge: "A vet clinic runs on paper charts, a separate cash log, and word of mouth for who's actually in the building. Nothing connects, nothing is backed up, and nothing a client can check themselves. The goal was one system that covers the whole clinic day, not a single dashboard with sample data.",
    solution: "Built module by module against how a real clinic actually runs: SOAP-format medical records with vaccine due-date tracking, a genuine point-of-sale layer with store credit and split payments, confinement tracking for boarded patients, and a client portal so pet owners can see their own records and balance. Every permission boundary is enforced twice, in the app and independently at the database level, and every edit or deletion across the system is captured automatically in an audit log, not something any screen has to remember to record.",
    role: "Freelance: architecture, backend, and full-stack development",
    duration: "Shipped, built module by module",
    gallery: [
      { src: "./assets/pawcare/pawcare-dashboard.jpg", caption: "Dashboard: what needs attention today, not a wall of charts nobody reads." },
      { src: "./assets/pawcare/pawcare-patients.jpg", caption: "Patient records tied to owners, with fast owner lookup during intake." },
      { src: "./assets/pawcare/pawcare-billing.jpg", caption: "Real point-of-sale billing: services, inventory, and packages itemized on one charge." },
      { src: "./assets/pawcare/pawcare-permissions.jpg", caption: "Generated live from the app's own permission logic, so it can't drift out of date." },
      { src: "./assets/pawcare/pawcare-auditlog.jpg", caption: "Every edit or deletion logged automatically: who, what, and when." },
      { src: "./assets/pawcare/pawcare-examrecord.jpg", caption: "Records print to a clinic-branded physical exam form." },
      { src: "./assets/pawcare/pawcare-clientportal.jpg", caption: "Client portal: balance, downpayments, and Lalamove delivery status in one place." }
    ],
    highlights: ["Role-based access for admin, vet, and reception, enforced at the database level", "Real point-of-sale billing with store credit and split payments", "Automatic vaccine due-date tracking with email and SMS reminders", "Offline-first: core records stay usable without a connection"],
    liveUrl: "",
    sourceUrl: ""
  }

};
