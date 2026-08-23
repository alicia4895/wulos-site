import React, { useState, useMemo } from "react";
import {
  Snowflake,
  Truck,
  Thermometer,
  MapPin,
  Phone,
  CreditCard,
  Plus,
  Minus,
  ShoppingCart,
  Check,
  X,
} from "lucide-react";

// ---- Pricing logic -----------------------------------------------------
// R15 per pack, but every full bundle of 10 packs is R100 instead of R150.
function calcPackPrice(qty) {
  if (qty <= 0) return 0;
  const bundles = Math.floor(qty / 10);
  const remainder = qty % 10;
  return bundles * 100 + remainder * 15;
}

function fullPriceNoDiscount(qty) {
  return qty * 15;
}

const DELIVERY_FEE = 250;
const FREEZER_PRICE = 1500;

const currency = (n) =>
  `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;

// ---- PayFast integration ------------------------------------------------
// Fill these in from your PayFast dashboard (Settings > Integration).
// Sandbox credentials are free — register at https://sandbox.payfast.co.za
// to test without moving real money before you switch sandbox to false.
const PAYFAST_CONFIG = {
  sandbox: true, // set to false only once you've tested with real sandbox payments
  merchantId: "10053370", // replace with your merchant_id
  merchantKey: "cy495e0osf3q5", // replace with your merchant_key
  // These three must be real, publicly reachable URLs on your deployed site —
  // they won't work from inside this artifact preview, only once it's hosted.
  returnUrl: "https://wulos-site-2zo7.vercel.app/",
  cancelUrl: " https://wulos-site-2zo7.vercel.app/",
  notifyUrl: " https://wulos-site.vercel.app/api/payfast-notify",
};

function generateOrderRef() {
  return `WULO-${Date.now()}`;
}

// Builds the summary line PayFast shows the customer on its payment page.
function buildItemName({ packQty, freezerQty }) {
  const parts = [];
  if (packQty > 0) parts.push(`${packQty} ice pack(s)`);
  if (freezerQty > 0) parts.push(`${freezerQty} freezer hire`);
  return parts.join(" + ") || "Wulo's Ice Cubes order";
}

// Creates a hidden form with the required PayFast fields and submits it,
// which redirects the customer to PayFast's secure hosted payment page.
// PayFast — not this site — collects the card number.
function redirectToPayFast({ amount, itemName, orderRef, customer }) {
  const action = PAYFAST_CONFIG.sandbox
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";

  const [nameFirst, ...rest] = customer.name.trim().split(" ");

  const fields = {
    merchant_id: PAYFAST_CONFIG.merchantId,
    merchant_key: PAYFAST_CONFIG.merchantKey,
    return_url: PAYFAST_CONFIG.returnUrl,
    cancel_url: PAYFAST_CONFIG.cancelUrl,
    notify_url: PAYFAST_CONFIG.notifyUrl,
    name_first: nameFirst || customer.name,
    name_last: rest.join(" "),
    m_payment_id: orderRef,
    amount: amount.toFixed(2),
    item_name: itemName,
    custom_str1: customer.phone,
    custom_str2: customer.address,
    custom_str3: customer.date || "",
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.style.display = "none";

  Object.entries(fields).forEach(([key, value]) => {
    if (!value) return;
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

export default function WulosIceCubes() {
  const [packQty, setPackQty] = useState(0);
  const [freezerQty, setFreezerQty] = useState(0);
  const [stage, setStage] = useState("shop"); // shop -> details -> pay -> done
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    date: "",
    notes: "",
  });

  const packPrice = calcPackPrice(packQty);
  const packSavings = fullPriceNoDiscount(packQty) - packPrice;
  const freezerTotal = freezerQty * FREEZER_PRICE;
  const hasItems = packQty > 0 || freezerQty > 0;
  const delivery = hasItems ? DELIVERY_FEE : 0;
  const total = packPrice + freezerTotal + delivery;

  const canCheckout = hasItems;
  const detailsValid =
    customer.name.trim() && customer.phone.trim() && customer.address.trim();

  const step = (setter, val, delta, min = 0) =>
    setter(Math.max(min, val + delta));

  return (
    <div
      style={{
        fontFamily: "'Work Sans', sans-serif",
        background: "#FFF4DE",
        color: "#0B2027",
        minHeight: "100%",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Work+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        .display-font { font-family: 'Baloo 2', sans-serif; }
        .mono-font { font-family: 'IBM Plex Mono', monospace; }
        @keyframes shimmer {
          0%, 100% { transform: translateY(0) scaleY(1); opacity: 0.5; }
          50% { transform: translateY(-6px) scaleY(1.08); opacity: 0.9; }
        }
        .heat-line { animation: shimmer 2.4s ease-in-out infinite; }
        .heat-line:nth-child(2) { animation-delay: 0.3s; }
        .heat-line:nth-child(3) { animation-delay: 0.6s; }
        .heat-line:nth-child(4) { animation-delay: 0.9s; }
        @keyframes drip {
          0% { height: 0; opacity: 0; }
          40% { opacity: 1; }
          100% { height: 14px; opacity: 0; }
        }
        .ice-drip { animation: drip 2.8s ease-in infinite; }
        .price-tag {
          transform: rotate(-6deg);
        }
      `}</style>

      {/* NAV */}
      <nav
        className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
        style={{ background: "#FFF4DE", borderBottom: "2px solid #0B2027" }}
      >
        <div className="flex items-center gap-2">
          <Snowflake style={{ color: "#0E7C9E" }} size={26} />
          <span className="display-font text-xl" style={{ fontWeight: 800 }}>
            Wulo&apos;s Ice Cubes
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm mono-font">
          <MapPin size={16} />
          <span>Serving Giyani &amp; surrounds</span>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden px-6 py-14 sm:py-20">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className="display-font leading-tight"
            style={{ fontSize: "clamp(2.2rem, 6vw, 3.6rem)", fontWeight: 800 }}
          >
            Cold when Giyani isn&apos;t.
          </h1>
          <p className="mt-4 text-lg" style={{ opacity: 0.85 }}>
            Ice packs at R15 each, cheaper by the bundle, delivered to your
            door — plus mobile freezers for hire when the whole event needs
            to stay cold.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <a
              href="#shop"
              className="px-6 py-3 rounded-full font-semibold"
              style={{ background: "#0E7C9E", color: "#FFF4DE" }}
            >
              Shop ice packs
            </a>
            <a
              href="#freezer"
              className="px-6 py-3 rounded-full font-semibold border-2"
              style={{ borderColor: "#0B2027" }}
            >
              Hire a mobile freezer
            </a>
          </div>
        </div>

        {/* heat shimmer + price tag signature */}
        <div className="absolute inset-x-0 bottom-0 h-24 flex justify-center gap-3 opacity-40 pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="heat-line w-1 rounded-full"
              style={{ height: 60, background: "#FFB100" }}
            />
          ))}
        </div>

        <div
          className="price-tag hidden md:flex absolute top-10 right-10 flex-col items-center justify-center shadow-lg"
          style={{
            width: 108,
            height: 108,
            background: "#E4572E",
            color: "#FFF4DE",
            borderRadius: 12,
          }}
        >
          <span className="mono-font text-xs" style={{ opacity: 0.85 }}>
            bundle deal
          </span>
          <span className="display-font text-2xl" style={{ fontWeight: 800 }}>
            10=R100
          </span>
        </div>
      </section>

      {/* SHOP */}
      <section id="shop" className="px-6 py-10 max-w-5xl mx-auto">
        <h2 className="display-font text-2xl mb-1" style={{ fontWeight: 700 }}>
          Ice packs
        </h2>
        <p className="text-sm mb-6" style={{ opacity: 0.75 }}>
          R15 a pack. Every full 10 packs costs R100 instead of R150 — the
          discount stacks automatically as you add more.
        </p>

        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6"
          style={{ background: "white", border: "2px solid #0B2027" }}
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 84, height: 84, background: "#BEEBFF" }}
          >
            <Snowflake size={40} style={{ color: "#0E7C9E" }} />
          </div>

          <div className="flex-1">
            <div className="font-semibold text-lg">Ice pack (bag)</div>
            <div className="text-sm mono-font" style={{ opacity: 0.7 }}>
              R15 each · R100 per bundle of 10
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => step(setPackQty, packQty, -1)}
              className="w-9 h-9 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: "#0B2027" }}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="mono-font w-8 text-center text-lg">
              {packQty}
            </span>
            <button
              onClick={() => step(setPackQty, packQty, 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#0E7C9E", color: "white" }}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="text-right min-w-[110px]">
            <div className="mono-font text-xl font-semibold">
              {currency(packPrice)}
            </div>
            {packSavings > 0 && (
              <div className="text-xs" style={{ color: "#0E7C9E" }}>
                you save {currency(packSavings)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FREEZER HIRE */}
      <section id="freezer" className="px-6 py-10 max-w-5xl mx-auto">
        <h2 className="display-font text-2xl mb-1" style={{ fontWeight: 700 }}>
          Mobile freezer hire
        </h2>
        <p className="text-sm mb-6" style={{ opacity: 0.75 }}>
          For parties, funerals, tuck shops, or events — a flat R1500 per
          freezer, no bundle discount.
        </p>

        <div
          className="rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-6"
          style={{ background: "white", border: "2px solid #0B2027" }}
        >
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 84, height: 84, background: "#FFE7B8" }}
          >
            <Thermometer size={40} style={{ color: "#FFB100" }} />
          </div>

          <div className="flex-1">
            <div className="font-semibold text-lg">Mobile freezer unit</div>
            <div className="text-sm mono-font" style={{ opacity: 0.7 }}>
              R1500 per unit, per hire
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => step(setFreezerQty, freezerQty, -1)}
              className="w-9 h-9 rounded-full flex items-center justify-center border-2"
              style={{ borderColor: "#0B2027" }}
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="mono-font w-8 text-center text-lg">
              {freezerQty}
            </span>
            <button
              onClick={() => step(setFreezerQty, freezerQty, 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "#0E7C9E", color: "white" }}
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="text-right min-w-[110px]">
            <div className="mono-font text-xl font-semibold">
              {currency(freezerTotal)}
            </div>
          </div>
        </div>
      </section>

      {/* ORDER SUMMARY / CHECKOUT */}
      <section className="px-6 py-10 max-w-2xl mx-auto">
        <div
          className="rounded-2xl p-6"
          style={{ background: "#0B2027", color: "#FFF4DE" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={20} />
            <span className="display-font text-lg" style={{ fontWeight: 700 }}>
              Your order
            </span>
          </div>

          {!hasItems && (
            <p className="text-sm" style={{ opacity: 0.7 }}>
              Add ice packs or a freezer hire above to get started.
            </p>
          )}

          {hasItems && (
            <div className="space-y-2 text-sm mono-font">
              {packQty > 0 && (
                <div className="flex justify-between">
                  <span>{packQty} × ice pack</span>
                  <span>{currency(packPrice)}</span>
                </div>
              )}
              {freezerQty > 0 && (
                <div className="flex justify-between">
                  <span>{freezerQty} × freezer hire</span>
                  <span>{currency(freezerTotal)}</span>
                </div>
              )}
              <div className="flex justify-between" style={{ opacity: 0.8 }}>
                <span className="flex items-center gap-1">
                  <Truck size={14} /> Delivery (Giyani area)
                </span>
                <span>{currency(delivery)}</span>
              </div>
              <div
                className="flex justify-between pt-3 mt-2 text-base font-semibold"
                style={{ borderTop: "1px solid rgba(255,244,222,0.3)" }}
              >
                <span>Total</span>
                <span>{currency(total)}</span>
              </div>
            </div>
          )}

          {hasItems && stage === "shop" && (
            <button
              onClick={() => setStage("details")}
              className="mt-5 w-full py-3 rounded-full font-semibold"
              style={{ background: "#FFB100", color: "#0B2027" }}
            >
              Continue to delivery details
            </button>
          )}

          {stage === "details" && (
            <div className="mt-5 space-y-3">
              <input
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ color: "#0B2027" }}
                placeholder="Full name"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
              />
              <input
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ color: "#0B2027" }}
                placeholder="Phone number"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
              />
              <input
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ color: "#0B2027" }}
                placeholder="Delivery address in Giyani"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
              />
              <input
                type="date"
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ color: "#0B2027" }}
                value={customer.date}
                onChange={(e) =>
                  setCustomer({ ...customer, date: e.target.value })
                }
              />
              <textarea
                className="w-full px-4 py-2 rounded-lg text-sm"
                style={{ color: "#0B2027" }}
                placeholder="Notes (optional)"
                rows={2}
                value={customer.notes}
                onChange={(e) =>
                  setCustomer({ ...customer, notes: e.target.value })
                }
              />

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setStage("shop")}
                  className="flex-1 py-3 rounded-full font-semibold border-2"
                  style={{ borderColor: "#FFF4DE" }}
                >
                  Back
                </button>
                <button
                  disabled={!detailsValid}
                  onClick={() => detailsValid && setStage("pay")}
                  className="flex-1 py-3 rounded-full font-semibold"
                  style={{
                    background: detailsValid ? "#0E7C9E" : "#3a4a4f",
                    color: "#FFF4DE",
                  }}
                >
                  Continue to payment
                </button>
              </div>
            </div>
          )}

          {stage === "pay" && (
            <div className="mt-5 space-y-4">
              <div
                className="rounded-lg p-4 text-sm"
                style={{ background: "rgba(255,244,222,0.08)" }}
              >
                <div className="flex items-center gap-2 mb-1 font-semibold">
                  <CreditCard size={16} /> Secure payment
                </div>
                <p style={{ opacity: 0.8 }}>
                  Card details are entered on PayFast&apos;s secure page, not
                  on this site. Wulo&apos;s never sees or stores your card
                  number.
                </p>
              </div>
              <button
                onClick={() =>
                  redirectToPayFast({
                    amount: total,
                    itemName: buildItemName({ packQty, freezerQty }),
                    orderRef: generateOrderRef(),
                    customer,
                  })
                }
                className="w-full py-3 rounded-full font-semibold"
                style={{ background: "#FFB100", color: "#0B2027" }}
              >
                Pay {currency(total)} with PayFast
              </button>
              <p className="text-xs text-center" style={{ opacity: 0.6 }}>
                {PAYFAST_CONFIG.sandbox
                  ? "Sandbox mode — no real money moves."
                  : "You'll be redirected to PayFast's secure page."}
              </p>
              <button
                onClick={() => setStage("details")}
                className="w-full py-2 text-sm underline"
                style={{ opacity: 0.75 }}
              >
                Back to details
              </button>
            </div>
          )}

          {stage === "done" && (
            <div className="mt-5 text-center py-4">
              <Check
                size={36}
                className="mx-auto mb-2"
                style={{ color: "#8CE38C" }}
              />
              <div className="font-semibold">Order placed!</div>
              <p className="text-sm mt-1" style={{ opacity: 0.8 }}>
                Wulo&apos;s will confirm your {packQty > 0 ? "ice packs" : ""}
                {packQty > 0 && freezerQty > 0 ? " and " : ""}
                {freezerQty > 0 ? "freezer hire" : ""} by phone before
                delivery.
              </p>
              <button
                onClick={() => {
                  setStage("shop");
                  setPackQty(0);
                  setFreezerQty(0);
                  setCustomer({
                    name: "",
                    phone: "",
                    address: "",
                    date: "",
                    notes: "",
                  });
                }}
                className="mt-4 text-sm underline"
              >
                Start a new order
              </button>
            </div>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-6 py-8 text-sm flex flex-col sm:flex-row justify-between gap-3 max-w-5xl mx-auto"
        style={{ opacity: 0.75 }}
      >
        <div className="flex items-center gap-2">
          <Phone size={14} /> Call or WhatsApp to confirm bulk orders
        </div>
        <div className="flex items-center gap-2">
          <MapPin size={14} /> Giyani, Limpopo
        </div>
      </footer>
    </div>
  );
}
