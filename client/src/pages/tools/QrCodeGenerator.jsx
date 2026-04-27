import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import ToolLayout from "../../components/ToolLayout";

const QR_TYPES = [
  { id: "url", label: "🌐 Website URL", placeholder: "https://example.com" },
  { id: "text", label: "📝 Plain Text", placeholder: "Enter any text..." },
  { id: "email", label: "📧 Email", placeholder: "email@example.com" },
  { id: "phone", label: "📞 Phone", placeholder: "+91 98765 43210" },
  { id: "wifi", label: "📶 WiFi", placeholder: "Network Name" },
  { id: "upi", label: "💳 UPI Payment", placeholder: "yourname@upi" },
];

const buildQRValue = (type, value, extra) => {
  switch (type) {
    case "url":
      return value.startsWith("http") ? value : `https://${value}`;
    case "email":
      return `mailto:${value}`;
    case "phone":
      return `tel:${value}`;
    case "wifi":
      return `WIFI:T:WPA;S:${value};P:${extra?.password || ""};H:false;`;
    case "upi":
      return `upi://pay?pa=${value}&pn=${extra?.name || ""}&am=${extra?.amount || ""}`;
    default:
      return value;
  }
};

export default function QrCodeGenerator() {
  const [type, setType] = useState("url");
  const [value, setValue] = useState("");
  const [extra, setExtra] = useState({});
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [generated, setGenerated] = useState(false);
  const [QRComponent, setQRComponent] = useState(null);

  const activeType = QR_TYPES.find((t) => t.id === type);
  const qrValue = buildQRValue(type, value, extra);

  // Try to load qrcode.react
  useEffect(() => {
    import("qrcode.react")
      .then((mod) => setQRComponent(() => mod.QRCodeCanvas || mod.QRCode))
      .catch(() => setQRComponent(null));
  }, []);

  const handleGenerate = () => {
    if (!value.trim()) return toast.error("Enter a value first");
    setGenerated(true);
    toast.success("QR Code generated!");
  };

  const handleDownload = () => {
    const canvas =
      document.querySelector("#qr-canvas canvas") ||
      document.querySelector("#qr-canvas");
    if (!canvas) return toast.error("QR not rendered yet");
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `qrcode-toolhub-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success("Downloaded!");
  };

  const reset = () => {
    setValue("");
    setExtra({});
    setGenerated(false);
  };

  return (
    <ToolLayout
      title="QR Code Generator"
      description="Generate QR codes for URLs, text, WiFi, UPI payments. Free — download instantly!"
      icon="📱"
    >
      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {QR_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setType(t.id);
              setValue("");
              setExtra({});
              setGenerated(false);
            }}
            className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all
              ${
                type === t.id
                  ? "bg-brand-500 border-brand-500 text-white"
                  : "bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="card p-5 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">
            {activeType?.label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setGenerated(false);
            }}
            placeholder={activeType?.placeholder}
            className="input"
          />
        </div>

        {type === "wifi" && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              WiFi Password
            </label>
            <input
              type="text"
              value={extra.password || ""}
              onChange={(e) => setExtra({ ...extra, password: e.target.value })}
              placeholder="WiFi password"
              className="input"
            />
          </div>
        )}

        {type === "upi" && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={extra.name || ""}
                onChange={(e) => setExtra({ ...extra, name: e.target.value })}
                placeholder="Display Name"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                Amount (optional)
              </label>
              <input
                type="number"
                value={extra.amount || ""}
                onChange={(e) => setExtra({ ...extra, amount: e.target.value })}
                placeholder="₹"
                className="input"
              />
            </div>
          </div>
        )}

        {/* Customize */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Size: <span className="text-white">{size}px</span>
            </label>
            <input
              type="range"
              min="128"
              max="400"
              step="32"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-brand-500 mt-1"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">QR Color</label>
            <input
              type="color"
              value={fgColor}
              onChange={(e) => setFgColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer border border-gray-700 bg-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Background
            </label>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer border border-gray-700 bg-gray-800"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={!value.trim()}
        className="btn-primary w-full"
      >
        📱 Generate QR Code
      </button>

      {/* QR Display */}
      {generated && value && (
        <div className="card p-6 animate-fade-up">
          <div id="qr-canvas" className="flex justify-center mb-5">
            <div
              style={{
                background: bgColor,
                padding: "16px",
                borderRadius: "12px",
              }}
            >
              {QRComponent ? (
                <QRComponent
                  value={qrValue}
                  size={Math.min(size, 300)}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level="M"
                />
              ) : (
                <div
                  style={{
                    width: "200px",
                    height: "200px",
                    background: "#f3f4f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "8px",
                    textAlign: "center",
                    padding: "16px",
                    fontSize: "12px",
                    color: "#374151",
                  }}
                >
                  Run:
                  <br />
                  <code
                    style={{
                      background: "#e5e7eb",
                      padding: "4px",
                      borderRadius: "4px",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    npm install qrcode.react
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-xl p-3 mb-4">
            <p className="text-xs text-gray-500 mb-1">QR Content</p>
            <p className="text-xs text-gray-300 font-mono break-all">
              {qrValue}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleDownload} className="btn-primary text-sm">
              ⬇️ Download PNG
            </button>
            <button onClick={reset} className="btn-secondary text-sm">
              🔄 New QR Code
            </button>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
