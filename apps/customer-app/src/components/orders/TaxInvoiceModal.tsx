"use client";

import { Printer, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { BootkitOrder } from "@/types/order";

interface TaxInvoiceModalProps {
  order: BootkitOrder;
  onClose: () => void;
}

function numberToWords(amount: number): string {
  const num = Math.round(amount);
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  const numStr = ("000000000" + num).slice(-9);
  const match = numStr.match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!match) return `INR ${num} Only`;

  let str = "";
  str += Number(match[1]) !== 0 ? (a[Number(match[1])] || `${b[Number(match[1][0])]} ${a[Number(match[1][1])]}`) + " Crore " : "";
  str += Number(match[2]) !== 0 ? (a[Number(match[2])] || `${b[Number(match[2][0])]} ${a[Number(match[2][1])]}`) + " Lakh " : "";
  str += Number(match[3]) !== 0 ? (a[Number(match[3])] || `${b[Number(match[3][0])]} ${a[Number(match[3][1])]}`) + " Thousand " : "";
  str += Number(match[4]) !== 0 ? (a[Number(match[4])] || `${b[Number(match[4][0])]} ${a[Number(match[4][1])]}`) + " Hundred " : "";
  str += Number(match[5]) !== 0 ? (str !== "" ? "and " : "") + (a[Number(match[5])] || `${b[Number(match[5][0])]} ${a[Number(match[5][1])]}`) + " " : "";

  return "INR " + str.trim() + " Only";
}

export default function TaxInvoiceModal({ order, onClose }: TaxInvoiceModalProps) {
  const createdAt = new Date(order.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = createdAt.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const totalMrp = order.items.reduce(
    (total, item) => total + item.product.mrp * item.quantity,
    0
  );
  const totalDiscount = Math.max(totalMrp - order.itemTotal, 0) + (order.offerDiscount || 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        {/* Header Actions */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-gray-900">
              Tax Invoice — {order.orderNumber}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#15803D] active:scale-95"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Container */}
        <div
          id="tax-invoice-printable"
          className="max-h-[80vh] overflow-y-auto p-4 text-black print:max-h-none print:overflow-visible print:p-0 sm:p-6"
        >
          {/* Main Invoice Card */}
          <div className="rounded-xl border border-gray-400 bg-white p-4 font-sans text-xs text-gray-900 print:border-none print:p-2">
            {/* Top Row: Brand + Tax Invoice Title */}
            <div className="flex items-center justify-between border-b border-gray-300 pb-3">
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-2xl font-black tracking-tight text-gray-950">
                    boot
                  </span>
                  <span className="text-2xl font-black tracking-tight text-[#16A34A]">
                    kit
                  </span>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                </div>
                <p className="text-[10px] font-semibold text-gray-500">
                  Quick commerce delivery service
                </p>
              </div>

              <div className="text-right">
                <h1 className="text-xl font-black uppercase tracking-wider text-gray-900">
                  Tax Invoice
                </h1>
                <p className="text-[10px] font-medium text-gray-500">
                  Original for Recipient
                </p>
              </div>
            </div>

            {/* Seller & Invoice Meta Grid */}
            <div className="grid grid-cols-1 gap-4 border-b border-gray-300 py-3 sm:grid-cols-2">
              {/* Sold By */}
              <div className="space-y-0.5 text-[11px] leading-relaxed">
                <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
                  Sold By / Seller:
                </p>
                <p className="font-bold text-gray-900">
                  BOOTKIT CONTRADE PRIVATE LIMITED
                </p>
                <p className="text-gray-600">
                  BootKiT Fulfillment Depot, Sector 14, Main Road
                </p>
                <p className="text-gray-600">
                  Gurugram, Haryana - 122001, India
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">GSTIN:</span> 06AAHCB2940F1ZD
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">FSSAI Lic No:</span> 11521999000156
                </p>
                <p className="text-gray-700">
                  <span className="font-semibold">CIN:</span> U51909DL2022PTC389129 | <span className="font-semibold">PAN:</span> AAHCB2940F
                </p>
              </div>

              {/* Invoice Meta & QR Code */}
              <div className="flex justify-between gap-3 text-[11px] sm:justify-end">
                <div className="space-y-1 text-right">
                  <p>
                    <span className="font-bold text-gray-500">Invoice No:</span>{" "}
                    <span className="font-mono font-bold text-gray-900">
                      INV-{order.orderNumber}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-gray-500">Invoice Date:</span>{" "}
                    <span className="font-medium text-gray-900">
                      {formattedDate} {formattedTime}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-gray-500">Order ID:</span>{" "}
                    <span className="font-mono font-bold text-gray-900">
                      {order.orderNumber}
                    </span>
                  </p>
                  <p>
                    <span className="font-bold text-gray-500">Payment Mode:</span>{" "}
                    <span className="font-semibold text-gray-900">
                      {order.paymentMethod} ({order.paymentStatus})
                    </span>
                  </p>
                </div>

                {/* QR Code */}
                <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-lg border border-gray-300 bg-white p-1">
                  <svg
                    viewBox="0 0 100 100"
                    className="h-full w-full"
                    fill="currentColor"
                  >
                    <path d="M0 0h30v30H0zm5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zm5 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zm5 5h20v20H5zM10 80h10v10H10zM40 10h10v10H40zm10 10h10v10H50zm-10 10h10v10H40zm20 10h10v10H60zm-20 20h10v10H40zm20 0h10v10H60zm10-10h10v10H70zm0 20h10v10H70zm10 10h10v10H80zm-40 0h10v10H40zm10 10h10v10H50z" />
                  </svg>
                  <span className="text-[8px] font-bold text-gray-500">Verified</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="border-b border-gray-300 py-3 text-[11px] leading-relaxed">
              <p className="font-bold uppercase tracking-wider text-gray-500 text-[10px]">
                Billed To & Delivered To:
              </p>
              <p className="font-bold text-gray-900">
                {order.address.fullName || "Valued Customer"}
              </p>
              <p className="text-gray-700">
                {order.address.houseNumber}, {order.address.street},{" "}
                {order.address.area}
                {order.address.landmark ? `, ${order.address.landmark}` : ""}
                , {order.address.city}, {order.address.state} - {order.address.pincode}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Phone:</span> +91 {order.address.phone} |{" "}
                <span className="font-semibold">Address Type:</span> {order.address.addressType}
              </p>
            </div>

            {/* Products Table */}
            <div className="py-3">
              <table className="w-full border-collapse text-left text-[11px]">
                <thead>
                  <tr className="border-b border-t border-gray-400 bg-gray-50 font-bold text-gray-700">
                    <th className="py-2 pl-2">#</th>
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">MRP (₹)</th>
                    <th className="py-2 text-right">Unit Price (₹)</th>
                    <th className="py-2 pr-2 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item, index) => {
                    const itemTotal = item.product.price * item.quantity;
                    return (
                      <tr key={`${item.product.id}-${index}`}>
                        <td className="py-2 pl-2 text-gray-500">{index + 1}</td>
                        <td className="py-2">
                          <p className="font-semibold text-gray-900">
                            {item.product.name}
                          </p>
                          <p className="text-[10px] text-gray-500">
                            {item.product.unit.label} • Brand: {item.product.brand}
                          </p>
                        </td>
                        <td className="py-2 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="py-2 text-right text-gray-500">
                          {formatPrice(item.product.mrp)}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatPrice(item.product.price)}
                        </td>
                        <td className="py-2 pr-2 text-right font-bold text-gray-900">
                          {formatPrice(itemTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bill Summary & Totals */}
            <div className="grid grid-cols-1 gap-4 border-t border-gray-300 pt-3 sm:grid-cols-2">
              {/* Amount in words & declarations */}
              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-500">
                    Amount in Words:
                  </p>
                  <p className="font-bold italic text-gray-900">
                    {numberToWords(order.totalAmount)}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-2.5 text-[10px] text-gray-600">
                  <p className="font-bold text-gray-700">Tax Breakdown (GST):</p>
                  <p>CGST (2.5% / 9%): Included</p>
                  <p>SGST (2.5% / 9%): Included</p>
                  <p className="mt-1 italic text-gray-500">
                    All prices are inclusive of applicable taxes.
                  </p>
                </div>
              </div>

              {/* Numerical Calculation */}
              <div className="space-y-1.5 text-right text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">Item Total (MRP):</span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(totalMrp)}
                  </span>
                </div>

                {totalDiscount > 0 && (
                  <div className="flex justify-between text-[#16A34A]">
                    <span>Discount Savings:</span>
                    <span className="font-bold">
                      -{formatPrice(totalDiscount)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className="font-medium text-gray-900">
                    {order.deliveryFee === 0 ? "FREE" : formatPrice(order.deliveryFee)}
                  </span>
                </div>

                <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-black text-gray-900">
                  <span>Grand Total:</span>
                  <span className="text-base text-[#16A34A]">
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 border-t border-gray-300 pt-3 text-center text-[10px] text-gray-500">
              <p>
                This is a computer generated invoice and does not require a physical signature.
              </p>
              <p className="mt-0.5 font-semibold text-gray-700">
                For BootKiT Contrade Private Limited • Authorized Signatory
              </p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #tax-invoice-printable,
            #tax-invoice-printable * {
              visibility: visible !important;
            }
            #tax-invoice-printable {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 5mm !important;
              background: white !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
