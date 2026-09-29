import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Apple,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  FileBarChart,
  Flame,
  HeartHandshake,
  Leaf,
  MapPin,
  Menu,
  Navigation,
  PackageCheck,
  Recycle,
  Route,
  Salad,
  Search,
  ShieldCheck,
  Sparkles,
  Soup,
  TimerReset,
  TrendingUp,
  Utensils,
  X,
} from "lucide-react";
import { toast } from "sonner";

type Batch = {
  id: string;
  name: string;
  provider: string;
  location: string;
  distance: number;
  total: number;
  reserved: number;
  safeUntil: string;
  minutesLeft: number;
  category: string;
  tags: string[];
  icon: LucideIcon;
  tone: string;
};

type Reservation = {
  batchId: string;
  batchName: string;
  provider: string;
  location: string;
  quantity: number;
  secondsLeft: number;
};

const initialBatches: Batch[] = [
  {
    id: "BATCH-0891",
    name: "Vegetable rice & dal",
    provider: "Maya Campus Kitchen",
    location: "Block A · Koramangala",
    distance: 1.2,
    total: 64,
    reserved: 24,
    safeUntil: "7:00 PM",
    minutesLeft: 42,
    category: "Meals",
    tags: ["Vegetarian", "High protein"],
    icon: Salad,
    tone: "bg-[#e5f0e8] text-[#2d7653]",
  },
  {
    id: "BATCH-0886",
    name: "Millet bowls with paneer",
    provider: "Northstar Tech Cafeteria",
    location: "5th Block · HSR Layout",
    distance: 2.7,
    total: 38,
    reserved: 0,
    safeUntil: "7:30 PM",
    minutesLeft: 71,
    category: "Meals",
    tags: ["Vegetarian", "Dairy"],
    icon: Soup,
    tone: "bg-[#f5ead9] text-[#b07336]",
  },
  {
    id: "BATCH-0883",
    name: "Fresh bread & fruit",
    provider: "The Daily Loaf",
    location: "12th Main · Indiranagar",
    distance: 3.4,
    total: 26,
    reserved: 8,
    safeUntil: "8:15 PM",
    minutesLeft: 116,
    category: "Bakery",
    tags: ["Vegetarian", "No allergens"],
    icon: Apple,
    tone: "bg-[#f7e3df] text-[#ba5c45]",
  },
  {
    id: "BATCH-0879",
    name: "Lemon rice & curd",
    provider: "Aster Hospital Kitchen",
    location: "Service Gate · Domlur",
    distance: 4.1,
    total: 52,
    reserved: 52,
    safeUntil: "6:45 PM",
    minutesLeft: 27,
    category: "Meals",
    tags: ["Vegetarian", "Chilled"],
    icon: Utensils,
    tone: "bg-[#e9e8f7] text-[#635d9b]",
  },
];

const navGroups: { label?: string; items: { name: string; icon: LucideIcon; count?: string }[] }[] = [
  {
    items: [
      { name: "Overview", icon: Compass },
      { name: "Surplus map", icon: MapPin },
      { name: "Requests", icon: TimerReset, count: "2" },
      { name: "Impact ledger", icon: TrendingUp },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Reports", icon: FileBarChart },
      { name: "Safety rules", icon: ShieldCheck },
    ],
  },
];

const formatTimer = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const remainingSeconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
};

function StatCard({
  label,
  value,
  change,
  detail,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: string;
  change?: string;
  detail: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <div className="group rounded-[22px] border border-[#e5e9e1] bg-white p-5 shadow-[0_8px_30px_rgba(35,48,39,0.03)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(35,48,39,0.08)]">
      <div className="mb-7 flex items-start justify-between">
        <div className={`flex size-10 items-center justify-center rounded-2xl ${iconClass}`}>
          <Icon className="size-[18px]" strokeWidth={1.8} />
        </div>
        {change ? (
          <span className="flex items-center gap-1 rounded-full bg-[#edf7ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-[#2d7653]">
            <ArrowUpRight className="size-3" /> {change}
          </span>
        ) : null}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8b978d]">{label}</p>
      <p className="mt-1 font-display text-[31px] leading-none tracking-[-0.04em] text-[#233027]">{value}</p>
      <p className="mt-2 text-xs text-[#8a958d]">{detail}</p>
    </div>
  );
}

function StatusBadge({ batch }: { batch: Batch }) {
  const remaining = batch.total - batch.reserved;
  const label = remaining === 0 ? "Fully reserved" : batch.reserved > 0 ? "Partially reserved" : "Available";
  const classes = remaining === 0 ? "bg-[#f7e5e2] text-[#b4513e]" : batch.reserved > 0 ? "bg-[#f6efdf] text-[#a76b2d]" : "bg-[#e7f3e9] text-[#2d7653]";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${classes}`}>{label}</span>;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("Overview");
  const [batches, setBatches] = useState(initialBatches);
  const [filter, setFilter] = useState("All batches");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [pickupBatch, setPickupBatch] = useState<Batch | null>(null);
  const [duplicateBatch, setDuplicateBatch] = useState<Batch | null>(null);
  const [requestQuantity, setRequestQuantity] = useState("20");
  const [serviceArea, setServiceArea] = useState("Shanti Nagar");
  const [peopleCount, setPeopleCount] = useState("24");
  const [reservation, setReservation] = useState<Reservation | null>({
    batchId: "BATCH-0902",
    batchName: "Vegetable rice & dal",
    provider: "Maya Campus Kitchen",
    location: "Block A · Koramangala",
    quantity: 20,
    secondsLeft: 11 * 60 + 36,
  });

  useEffect(() => {
    if (!reservation) return;
    const timer = window.setInterval(() => {
      setReservation((current) => {
        if (!current || current.secondsLeft <= 1) return null;
        return { ...current, secondsLeft: current.secondsLeft - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [Boolean(reservation)]);

  const filteredBatches = useMemo(() => {
    if (filter === "Available now") return batches.filter((batch) => batch.total - batch.reserved > 0);
    if (filter === "Vegetarian") return batches.filter((batch) => batch.tags.includes("Vegetarian"));
    if (filter === "Under 2 km") return batches.filter((batch) => batch.distance < 2);
    return batches;
  }, [batches, filter]);

  const handleNavigation = (name: string) => {
    setActiveSection(name);
    setMobileNavOpen(false);
    if (name !== "Overview") {
      toast.info(`${name} workspace`, { description: "This view is ready for the next AnnaSetu release." });
    }
  };

  const openPickupFlow = (batch: Batch) => {
    if (batch.total - batch.reserved <= 0) {
      toast.error("This batch is fully reserved", { description: "Try another nearby listing or check back after a pickup window expires." });
      return;
    }
    if (batch.reserved > 0) {
      setDuplicateBatch(batch);
      return;
    }
    setPickupBatch(batch);
  };

  const continueFromDuplicate = () => {
    if (!duplicateBatch) return;
    setPickupBatch(duplicateBatch);
    setDuplicateBatch(null);
  };

  const confirmRequest = () => {
    if (!pickupBatch) return;
    const quantity = Number(requestQuantity);
    const available = pickupBatch.total - pickupBatch.reserved;
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > available) {
      toast.error(`Enter a quantity between 1 and ${available} meals.`);
      return;
    }
    setBatches((current) => current.map((batch) => batch.id === pickupBatch.id ? { ...batch, reserved: batch.reserved + quantity } : batch));
    setReservation({
      batchId: pickupBatch.id,
      batchName: pickupBatch.name,
      provider: pickupBatch.provider,
      location: pickupBatch.location,
      quantity,
      secondsLeft: 15 * 60,
    });
    setPickupBatch(null);
    toast.success("Pickup request confirmed", { description: `Collect ${quantity} meals within 15 minutes.` });
  };

  const releaseReservation = () => {
    if (!reservation) return;
    setBatches((current) => current.map((batch) => batch.id === reservation.batchId ? { ...batch, reserved: Math.max(0, batch.reserved - reservation.quantity) } : batch));
    setReservation(null);
    toast.success("Reservation released", { description: "The meals are available to other community members again." });
  };

  const confirmPickup = () => {
    if (!reservation) return;
    setReservation(null);
    toast.success("Pickup marked as collected", { description: "Thank you for moving food from surplus to service." });
  };

  const scrollToFeed = () => document.getElementById("surplus-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#f6f7f3] text-[#233027]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[258px] shrink-0 flex-col border-r border-[#e3e8e0] bg-[#fbfcf9] lg:flex">
          <div className="flex h-[88px] items-center gap-3 border-b border-[#e8ece5] px-7">
            <div className="relative flex size-10 items-center justify-center rounded-[15px] bg-[#e56c49] text-white shadow-[0_8px_16px_rgba(229,108,73,0.24)]">
              <Leaf className="size-[19px]" strokeWidth={2.1} />
              <span className="absolute bottom-[8px] right-[7px] size-1.5 rounded-full bg-[#ffd4a6]" />
            </div>
            <div>
              <p className="font-display text-[22px] leading-none tracking-[-0.03em] text-[#233027]">AnnaSetu</p>
              <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.19em] text-[#9aa49c]">Food rescue network</p>
            </div>
          </div>

          <div className="flex-1 px-4 py-7">
            {navGroups.map((group, groupIndex) => (
              <div key={group.label ?? groupIndex} className={groupIndex === 1 ? "mt-8" : ""}>
                {group.label ? <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a0aaa1]">{group.label}</p> : null}
                <div className="space-y-1">
                  {group.items.map(({ name, icon: Icon, count }) => {
                    const active = activeSection === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleNavigation(name)}
                        className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-[13px] font-semibold transition duration-150 ${active ? "bg-[#eaf2eb] text-[#2e7954] shadow-[inset_3px_0_0_#e56c49]" : "text-[#7a877d] hover:bg-[#f0f4ef] hover:text-[#314039]"}`}
                      >
                        <span className="flex items-center gap-3"><Icon className="size-[17px]" strokeWidth={active ? 2.2 : 1.8} />{name}</span>
                        {count ? <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${active ? "bg-[#d2e6d6] text-[#2e7954]" : "bg-[#eef1eb] text-[#8c978e]"}`}>{count}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button type="button" onClick={() => toast.info("Help & safety", { description: "Food safety guidance and community support are coming together here." })} className="mt-8 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[13px] font-semibold text-[#7a877d] transition hover:bg-[#f0f4ef] hover:text-[#314039]"><CircleHelp className="size-[17px]" strokeWidth={1.8} />Help & safety</button>
          </div>

          <div className="p-4">
            <div className="overflow-hidden rounded-[22px] bg-[#203a2d] p-4 text-white shadow-[0_10px_30px_rgba(32,58,45,0.14)]">
              <div className="mb-5 flex items-center justify-between"><span className="rounded-full bg-white/10 px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#d9eadc]">Your impact</span><HeartHandshake className="size-4 text-[#f2bc87]" /></div>
              <p className="font-display text-[29px] tracking-[-0.04em]">1,248</p>
              <p className="mt-0.5 text-[11px] text-[#aec4b3]">meals moved this month</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[72%] rounded-full bg-[#e8a36e]" /></div>
              <p className="mt-2 text-[10px] text-[#9db6a3]">72% of your monthly goal</p>
            </div>
            <div className="mt-5 flex items-center gap-3 px-2 pb-2"><div className="flex size-8 items-center justify-center rounded-full bg-[#dce9df] text-xs font-extrabold text-[#2d7653]">AM</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Aarav Mehta</p><p className="text-[10px] text-[#9aa49c]">Community volunteer</p></div><ChevronDown className="size-4 text-[#a2aba2]" /></div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-[#e5e9e2]/90 bg-[#f8f9f6]/90 px-5 backdrop-blur-xl lg:px-10">
            <div className="flex items-center gap-3">
              <button type="button" className="flex size-10 items-center justify-center rounded-xl border border-[#e4e9e2] bg-white lg:hidden" onClick={() => setMobileNavOpen((open) => !open)} aria-label="Open navigation"><Menu className="size-5" /></button>
              <div className="lg:hidden"><p className="font-display text-[21px] leading-none">AnnaSetu</p><p className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#9aa49c]">Food rescue network</p></div>
              <div className="hidden items-center gap-2 text-xs text-[#9aa49c] lg:flex"><span>Workspace</span><ChevronRight className="size-3" /><span className="font-bold text-[#526056]">{activeSection}</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full bg-[#edf2ed] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-[#6f7f73] md:flex"><span className="size-1.5 rounded-full bg-[#4eac72] shadow-[0_0_0_4px_rgba(78,172,114,0.12)]" />Live network</div>
              <button type="button" onClick={() => toast.info("No new notifications", { description: "You are all caught up across your active pickups." })} className="relative flex size-10 items-center justify-center rounded-full border border-[#e4e9e2] bg-white text-[#718076] transition hover:border-[#cbd8cb] hover:text-[#2d7653]" aria-label="Notifications"><Bell className="size-[17px]" strokeWidth={1.8} /><span className="absolute right-[9px] top-[8px] size-1.5 rounded-full bg-[#e56c49]" /></button>
              <button type="button" onClick={() => toast.success("New surplus listing", { description: "Provider listing flow opened for a future release." })} className="hidden items-center gap-2 rounded-full bg-[#e56c49] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_7px_16px_rgba(229,108,73,0.2)] transition hover:bg-[#d75f3d] active:scale-[0.97] sm:flex"><PackageCheck className="size-3.5" />List surplus</button>
            </div>
          </header>

          {mobileNavOpen ? (
            <div className="absolute inset-x-4 top-[84px] z-30 rounded-[22px] border border-[#e2e8e0] bg-white p-3 shadow-[0_18px_45px_rgba(35,48,39,0.12)] lg:hidden">
              {navGroups.flatMap((group) => group.items).map(({ name, icon: Icon, count }) => <button key={name} type="button" onClick={() => handleNavigation(name)} className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-semibold ${activeSection === name ? "bg-[#eaf2eb] text-[#2e7954]" : "text-[#657269]"}`}><span className="flex items-center gap-3"><Icon className="size-4" />{name}</span>{count ? <span className="rounded-full bg-[#eef1eb] px-2 text-[10px]">{count}</span> : null}</button>)}
            </div>
          ) : null}

          <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-10 lg:py-9">
            <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#97a39a]"><span>Thursday</span><span className="size-1 rounded-full bg-[#e56c49]" /><span>25 September 2026</span></div>
                <h1 className="font-display text-[40px] leading-[0.98] tracking-[-0.05em] text-[#233027] sm:text-[48px]">Good afternoon, Aarav<span className="text-[#e56c49]">.</span></h1>
                <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#7d897f]">Here’s what’s moving through your community today. Every pickup closes the gap between surplus and someone who needs a meal.</p>
              </div>
              <div className="flex items-center gap-3"><div className="hidden items-center gap-2 rounded-full border border-[#e3e8e1] bg-white px-3 py-2 text-[11px] font-semibold text-[#758178] sm:flex"><Navigation className="size-3.5 text-[#e56c49]" /> Koramangala <ChevronDown className="size-3" /></div><button type="button" onClick={() => toast.success("New surplus listing", { description: "Provider listing flow opened for a future release." })} className="flex items-center gap-2 rounded-full bg-[#233027] px-4 py-3 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(35,48,39,0.15)] transition hover:bg-[#31483a] active:scale-[0.97]"><PackageCheck className="size-3.5 text-[#f3bf8a]" /> List surplus</button></div>
            </div>

            <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Meals available nearby" value="96" change="12%" detail="Across 8 verified providers" icon={Utensils} iconClass="bg-[#e5f0e8] text-[#2d7653]" />
              <StatCard label="Reserved right now" value="32" change="8%" detail="Across 6 active requests" icon={TimerReset} iconClass="bg-[#f5ead9] text-[#ad7134]" />
              <StatCard label="Food waste prevented" value="2.8 t" change="24%" detail="This month · citywide" icon={Recycle} iconClass="bg-[#e8e8f5] text-[#6867a0]" />
              <StatCard label="Communities served" value="34" change="6" detail="This month · by volunteers" icon={HeartHandshake} iconClass="bg-[#f7e3df] text-[#bb5a45]" />
            </section>

            <section className="mb-8 grid gap-5 xl:grid-cols-[1.52fr_0.98fr]">
              <div className="relative min-h-[274px] overflow-hidden rounded-[26px] bg-[#203a2d] p-6 text-white shadow-[0_18px_42px_rgba(32,58,45,0.12)] sm:p-7">
                <div className="pointer-events-none absolute -right-16 -top-24 size-[280px] rounded-full border border-white/10" /><div className="pointer-events-none absolute right-8 top-8 size-[125px] rounded-full border border-white/10" /><div className="pointer-events-none absolute bottom-[-110px] left-[35%] size-[250px] rounded-full bg-[#e9a26d]/10 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between">
                  <div className="flex items-start justify-between"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a7c3ac]"><span className="size-1.5 animate-pulse rounded-full bg-[#f0b47f]" /> Active pickup</div><h2 className="font-display text-[30px] tracking-[-0.04em] sm:text-[34px]">Your next handover</h2></div><div className="rounded-2xl bg-white/10 p-3"><Clock3 className="size-5 text-[#f2b37e]" /></div></div>
                  {reservation ? <div className="mt-7 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9db6a3]">Collect within</p><p className="font-display text-[51px] leading-none tracking-[-0.05em] text-[#f7c28c]">{formatTimer(reservation.secondsLeft)}</p><div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#d0ded1]"><span className="font-bold text-white">REQ-712</span><span className="text-white/30">·</span><span>{reservation.quantity} meals</span><span className="text-white/30">·</span><span>{reservation.provider}</span></div></div><div className="max-w-[250px]"><p className="text-[17px] font-bold tracking-[-0.02em]">{reservation.batchName}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-[#a9c2ad]"><MapPin className="size-3.5" /> {reservation.location}</p><p className="mt-3 text-xs text-[#d2e0d3]">Serving <span className="font-bold text-white">{serviceArea || "your community"}</span></p></div></div> : <div className="mt-10"><p className="font-display text-3xl">No active handovers.</p><p className="mt-2 text-sm text-[#b4cab7]">Choose a nearby batch to put your next pickup in motion.</p></div>}
                  <div className="mt-7 flex flex-wrap gap-2.5">{reservation ? <><button type="button" onClick={confirmPickup} className="rounded-full bg-[#f0b47f] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#24372c] transition hover:bg-[#f7c998] active:scale-[0.97]">Confirm pickup</button><button type="button" onClick={() => toast.success("Directions ready", { description: `Opening the route to ${reservation.location}.` })} className="rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white transition hover:bg-white/10 active:scale-[0.97]">Get directions</button><button type="button" onClick={releaseReservation} className="rounded-full px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#9db6a3] transition hover:text-white">Release reservation</button></> : <button type="button" onClick={scrollToFeed} className="rounded-full bg-[#f0b47f] px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#24372c] transition hover:bg-[#f7c998]">Browse surplus</button>}</div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-[26px] border border-[#eddfc7] bg-[#f6ead7] p-6 sm:p-7"><div className="absolute -right-12 -top-10 size-40 rounded-full border border-[#e3c99f]" /><div className="absolute -right-3 top-0 size-20 rounded-full border border-[#e3c99f]" /><div className="relative flex h-full flex-col"><div className="flex items-center justify-between"><span className="flex items-center gap-2 rounded-full bg-white/60 px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a26738]"><Sparkles className="size-3.5" /> AI routing note</span><span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#b8895a]">just now</span></div><h2 className="mt-8 max-w-[300px] font-display text-[29px] leading-[1.03] tracking-[-0.04em] text-[#5a3f2b]">One batch needs a little attention<span className="text-[#e56c49]">.</span></h2><p className="mt-3 max-w-[350px] text-[13px] leading-5 text-[#876b50]">Northstar Tech Cafeteria has <span className="font-extrabold text-[#5a3f2b]">38 meals</span> with 71 minutes left. It matches your service area and current capacity.</p><div className="mt-auto flex items-end justify-between gap-4 pt-7"><div className="flex items-center gap-2"><div className="flex size-9 items-center justify-center rounded-full bg-[#e7c496] text-[10px] font-extrabold text-[#704e35]">AI</div><div><p className="text-[11px] font-bold text-[#6f5037]">94% match</p><p className="text-[10px] text-[#a37e5b]">Distance · capacity · timing</p></div></div><button type="button" onClick={scrollToFeed} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#a45f35] transition hover:text-[#72452a]">Review match <ArrowDownRight className="size-3.5" /></button></div></div></div>
            </section>

            <section id="surplus-feed" className="mb-8 scroll-mt-24 rounded-[26px] border border-[#e5e9e2] bg-white p-5 shadow-[0_8px_30px_rgba(35,48,39,0.03)] sm:p-6">
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9aa49c]"><span className="size-1.5 rounded-full bg-[#4eac72]" /> Live exchange</div><h2 className="font-display text-[29px] tracking-[-0.04em]">Surplus near you<span className="text-[#e56c49]">.</span></h2><p className="mt-1 text-xs text-[#8a958d]">Verified food, safe to collect now.</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#a4ada5]" /><input aria-label="Search surplus" placeholder="Search batches" className="h-9 w-[150px] rounded-full border border-[#e5e9e2] bg-[#fbfcfa] pl-9 pr-3 text-xs outline-none transition focus:border-[#a4c4aa]" /></div>{["All batches", "Available now", "Vegetarian", "Under 2 km"].map((item) => <button type="button" key={item} onClick={() => setFilter(item)} className={`rounded-full border px-3 py-2 text-[10px] font-bold transition ${filter === item ? "border-[#2e7954] bg-[#2e7954] text-white" : "border-[#e5e9e2] bg-[#fbfcfa] text-[#7d897f] hover:border-[#b7cdbb]"}`}>{item === "All batches" ? "Filters" : item}</button>)}</div></div>
              <div className="hidden grid-cols-[minmax(210px,1.35fr)_1.05fr_.75fr_.68fr_112px] gap-4 border-b border-[#eef1ec] px-3 pb-3 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#a0aaa1] md:grid"><span>Food batch</span><span>Provider / pickup point</span><span>Quantity</span><span>Safe until</span><span>Status</span></div>
              <div className="divide-y divide-[#eef1ec]">{filteredBatches.map((batch) => { const Icon = batch.icon; const available = batch.total - batch.reserved; return <div key={batch.id} className="grid gap-4 px-2 py-4 transition hover:bg-[#fbfcfa] md:grid-cols-[minmax(210px,1.35fr)_1.05fr_.75fr_.68fr_112px] md:items-center"><div className="flex items-center gap-3"><div className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${batch.tone}`}><Icon className="size-[17px]" strokeWidth={1.8} /></div><div className="min-w-0"><p className="truncate text-[13px] font-bold text-[#344239]">{batch.name}</p><div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-[#919c93]"><span>{batch.id}</span><span className="size-0.5 rounded-full bg-[#c2cbc3]" />{batch.tags.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-[#f0f3ef] px-1.5 py-0.5 font-semibold">{tag}</span>)}</div></div></div><div className="ml-[52px] md:ml-0"><p className="text-xs font-bold text-[#4c5b51]">{batch.provider}</p><p className="mt-1 flex items-center gap-1 text-[10px] text-[#929d94]"><MapPin className="size-3" /> {batch.location} · {batch.distance} km</p></div><div className="ml-[52px] md:ml-0"><p className="text-xs font-bold text-[#4c5b51]">{available} of {batch.total}</p><p className="mt-1 text-[10px] text-[#929d94]">{batch.reserved ? `${batch.reserved} reserved` : "ready to claim"}</p></div><div className="ml-[52px] md:ml-0"><p className="text-xs font-bold text-[#4c5b51]">{batch.safeUntil}</p><p className={`mt-1 flex items-center gap-1 text-[10px] ${batch.minutesLeft < 35 ? "text-[#bf624d]" : "text-[#929d94]"}`}><Clock3 className="size-3" /> {batch.minutesLeft} min remaining</p></div><div className="ml-[52px] flex items-center justify-between gap-3 md:ml-0 md:block"><StatusBadge batch={batch} /><div className="mt-2">{available > 0 ? <button type="button" onClick={() => openPickupFlow(batch)} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2e7954] transition hover:text-[#e56c49]">Request pickup <ChevronRight className="size-3" /></button> : <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#a0aaa1]">Join waitlist</span>}</div></div></div>; })}</div>
              {filteredBatches.length === 0 ? <div className="rounded-2xl bg-[#f7f9f6] px-5 py-10 text-center text-sm text-[#8a958d]">No nearby batches match this filter.</div> : null}
              <div className="mt-3 flex items-center justify-between border-t border-[#eef1ec] pt-4"><p className="text-[10px] font-semibold text-[#9aa49c]">Showing {filteredBatches.length} of {batches.length} active batches</p><button type="button" onClick={() => toast.info("Surplus map", { description: "Map view will open with verified pickup points in your area." })} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#2e7954]">Open surplus map <ChevronRight className="size-3.5" /></button></div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.18fr_.82fr]">
              <div className="overflow-hidden rounded-[26px] bg-[#233b2e] p-6 text-white sm:p-7"><div className="flex items-start justify-between"><div><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#a5c1ab]">Recovery route</div><h2 className="font-display text-[29px] tracking-[-0.04em]">Every batch has a next step<span className="text-[#f1b67f]">.</span></h2></div><button type="button" onClick={() => toast.info("Impact ledger", { description: "Your full recovery history will appear here." })} className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#d1e1d2]">View ledger <ChevronRight className="size-3.5" /></button></div><div className="mt-8 grid gap-5 sm:grid-cols-4">{[{ label: "Human food", value: "1,248", note: "meals", icon: Utensils }, { label: "Community pickup", value: "82", note: "handovers", icon: Route }, { label: "Food shelter", value: "14", note: "deliveries", icon: HeartHandshake }, { label: "Compost / biogas", value: "2.8 t", note: "recovered", icon: Recycle }].map(({ label, value, note, icon: Icon }, index) => <div key={label} className="relative"><div className="mb-4 flex size-9 items-center justify-center rounded-xl bg-white/10 text-[#f1b67f]"><Icon className="size-4" strokeWidth={1.8} /></div><p className="font-display text-[24px] tracking-[-0.04em]">{value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9eb8a4]">{label}</p><p className="mt-0.5 text-[10px] text-[#718e78]">{note}</p>{index < 3 ? <div className="absolute right-[-18px] top-4 hidden text-[#6f8f78] sm:block"><ChevronRight className="size-4" /></div> : null}</div>)}</div><div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><ShieldCheck className="size-4 shrink-0 text-[#f1b67f]" /><p className="text-[11px] leading-5 text-[#b7cbb9]">Food safety always comes first. Expired or flagged food is automatically removed from human redistribution.</p></div></div>

              <div className="relative overflow-hidden rounded-[26px] border border-[#e5e9e2] bg-[#f0f4ee] p-6 sm:p-7"><div className="flex items-start justify-between"><div><div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#99a69b]">Neighbourhood pulse</div><h2 className="font-display text-[29px] tracking-[-0.04em]">Food is moving nearby<span className="text-[#e56c49]">.</span></h2></div><div className="rounded-xl bg-white p-2.5 text-[#2e7954] shadow-sm"><MapPin className="size-4" /></div></div><div className="relative mt-6 h-[128px] overflow-hidden rounded-2xl border border-[#dce6dc] bg-[#e5eee3]"><div className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(#c9dbcb 1px, transparent 1px), linear-gradient(90deg, #c9dbcb 1px, transparent 1px)", backgroundSize: "31px 31px" }} /><div className="absolute left-[15%] top-[54%] h-px w-[73%] rotate-[-18deg] bg-[#a9c8ae]" /><div className="absolute left-[32%] top-[22%] h-px w-[59%] rotate-[31deg] bg-[#b7d0b9]" /><div className="absolute left-[54%] top-[41%] h-2 w-[27%] rotate-[16deg] rounded-full bg-[#c4d9c4]" />{[{ x: "18%", y: "58%", color: "bg-[#e56c49]", label: "24" }, { x: "48%", y: "33%", color: "bg-[#2e7954]", label: "38" }, { x: "75%", y: "67%", color: "bg-[#b57c3c]", label: "26" }].map((point) => <div key={point.label} className="absolute" style={{ left: point.x, top: point.y }}><span className={`absolute -left-2 -top-2 size-4 animate-ping rounded-full ${point.color} opacity-25`} /><span className={`relative flex size-4 items-center justify-center rounded-full border-2 border-white ${point.color} shadow-sm`} /><span className="absolute left-1/2 top-5 -translate-x-1/2 text-[9px] font-extrabold text-[#57715c]">{point.label}</span></div>)}<div className="absolute bottom-2 left-2 rounded-md bg-white/80 px-2 py-1 text-[8px] font-extrabold uppercase tracking-[0.14em] text-[#68816b]">Koramangala live</div></div><div className="mt-5 grid grid-cols-3 gap-3"><div><p className="font-display text-[23px] tracking-[-0.04em]">8</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a195]">providers</p></div><div><p className="font-display text-[23px] tracking-[-0.04em]">3</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a195]">shelters</p></div><div><p className="font-display text-[23px] tracking-[-0.04em]">12</p><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94a195]">volunteers</p></div></div></div>
            </section>
            <footer className="flex flex-col gap-2 py-8 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a4ada5] sm:flex-row sm:items-center sm:justify-between"><span>AnnaSetu · Food rescue network</span><span className="flex items-center gap-2"><span className="size-1 rounded-full bg-[#4eac72]" /> Prototype workspace · Safe food, shared responsibility</span></footer>
          </main>
        </div>
      </div>

      {duplicateBatch ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18271e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="duplicate-title"><div className="w-full max-w-[430px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(22,39,29,0.25)]"><div className="flex items-start justify-between"><div className="flex size-11 items-center justify-center rounded-2xl bg-[#f6ead7] text-[#ac6e34]"><Bell className="size-5" /></div><button type="button" onClick={() => setDuplicateBatch(null)} className="flex size-9 items-center justify-center rounded-full bg-[#f5f7f4] text-[#7c897e]" aria-label="Close"><X className="size-4" /></button></div><p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#a06a36]">Duplicate pickup alert</p><h2 id="duplicate-title" className="mt-2 font-display text-[30px] leading-tight tracking-[-0.04em]">Food from this location has already been requested<span className="text-[#e56c49]">.</span></h2><p className="mt-3 text-sm leading-6 text-[#718076]">Another community member has an active reservation for this food. <span className="font-bold text-[#415047]">{duplicateBatch.reserved} meals</span> are currently reserved, but there are still <span className="font-bold text-[#415047]">{duplicateBatch.total - duplicateBatch.reserved} meals</span> available.</p><div className="mt-5 rounded-2xl bg-[#f4f7f2] p-4"><p className="text-xs font-bold text-[#415047]">{duplicateBatch.name}</p><p className="mt-1 text-[11px] text-[#89958b]">{duplicateBatch.provider} · {duplicateBatch.location}</p></div><div className="mt-6 flex gap-3"><button type="button" onClick={() => setDuplicateBatch(null)} className="flex-1 rounded-full border border-[#e2e8e1] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#718076]">Cancel</button><button type="button" onClick={continueFromDuplicate} className="flex-1 rounded-full bg-[#e56c49] px-4 py-3 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white">Continue request</button></div></div></div> : null}

      {pickupBatch ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18271e]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="pickup-title"><div className="w-full max-w-[460px] rounded-[26px] bg-white p-6 shadow-[0_24px_80px_rgba(22,39,29,0.25)]"><div className="flex items-start justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.17em] text-[#2e7954]">Request a pickup</p><h2 id="pickup-title" className="mt-2 font-display text-[30px] tracking-[-0.04em]">Move this batch to service<span className="text-[#e56c49]">.</span></h2></div><button type="button" onClick={() => setPickupBatch(null)} className="flex size-9 items-center justify-center rounded-full bg-[#f5f7f4] text-[#7c897e]" aria-label="Close"><X className="size-4" /></button></div><div className="mt-5 rounded-2xl bg-[#f1f6f0] p-4"><div className="flex items-center gap-3"><div className={`flex size-10 items-center justify-center rounded-2xl ${pickupBatch.tone}`}><pickupBatch.icon className="size-[17px]" /></div><div><p className="text-sm font-bold text-[#3c4d42]">{pickupBatch.name}</p><p className="mt-1 text-[11px] text-[#839087]">{pickupBatch.provider} · {pickupBatch.location}</p></div></div><div className="mt-4 flex items-center justify-between border-t border-[#dce8dc] pt-3 text-[11px]"><span className="text-[#859289]">Available to reserve</span><span className="font-extrabold text-[#2e7954]">{pickupBatch.total - pickupBatch.reserved} meals</span></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#849087]">Meals needed<input value={requestQuantity} onChange={(event) => setRequestQuantity(event.target.value)} type="number" min="1" max={pickupBatch.total - pickupBatch.reserved} className="mt-2 h-11 w-full rounded-xl border border-[#e2e8e1] px-3 text-sm font-bold text-[#3c4d42] outline-none focus:border-[#79a984]" /></label><label className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#849087]">People you’re helping<input value={peopleCount} onChange={(event) => setPeopleCount(event.target.value)} type="number" min="1" className="mt-2 h-11 w-full rounded-xl border border-[#e2e8e1] px-3 text-sm font-bold text-[#3c4d42] outline-none focus:border-[#79a984]" /></label></div><label className="mt-4 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#849087]">Intended distribution area<input value={serviceArea} onChange={(event) => setServiceArea(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#e2e8e1] px-3 text-sm font-bold text-[#3c4d42] outline-none focus:border-[#79a984]" /></label><div className="mt-5 flex items-start gap-2 rounded-xl bg-[#fff5e9] p-3 text-[11px] leading-5 text-[#9a6f45]"><Clock3 className="mt-0.5 size-3.5 shrink-0" /> Once confirmed, you’ll have 15 minutes to physically collect this food from the provider.</div><button type="button" onClick={confirmRequest} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#e56c49] px-4 py-3.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-white shadow-[0_8px_18px_rgba(229,108,73,0.2)] transition hover:bg-[#d75f3d] active:scale-[0.98]">Confirm pickup request <ChevronRight className="size-3.5" /></button></div></div> : null}
    </div>
  );
}
