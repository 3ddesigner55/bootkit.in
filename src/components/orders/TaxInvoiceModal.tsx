"use client";

import { Download, Printer, X } from "lucide-react";
import type { BootkitOrder } from "@/types/order";

interface TaxInvoiceModalProps {
  order: BootkitOrder;
  onClose: () => void;
}

function numberToWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);

  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertChunk(num: number): string {
    let str = "";
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      str +=
        tens[Math.floor(num / 10)] +
        (num % 10 !== 0 ? " " + units[num % 10] : "") +
        " ";
    } else if (num > 0) {
      str += units[num] + " ";
    }
    return str.trim();
  }

  function convertRupees(num: number): string {
    if (num === 0) return "Zero";
    let res = "";
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = num;

    if (crore > 0) res += convertChunk(crore) + " Crore ";
    if (lakh > 0) res += convertChunk(lakh) + " Lakh ";
    if (thousand > 0) res += convertChunk(thousand) + " Thousand ";
    if (hundred > 0) res += convertChunk(hundred) + " ";

    return res.trim();
  }

  const rupeesWord = convertRupees(rupees);
  const paisaWord = paisa > 0 ? convertRupees(paisa) + " Paisa" : "Zero Paisa";

  return `${rupeesWord} Rupees And ${paisaWord} Only`;
}

export default function TaxInvoiceModal({
  order,
  onClose,
}: TaxInvoiceModalProps) {
  const createdAt = new Date(order.createdAt);
  const formattedDate = createdAt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const invoiceNumber = `C${order.orderNumber.replace(/\D/g, "").slice(0, 5)}T${order.orderNumber.replace(/\D/g, "").slice(5, 14) || "250072620"}`;

  const stateName = order.address?.state || "Rajasthan";
  const pincode = order.address?.pincode || "302025";
  const customerName = order.address?.fullName || "Valued Customer";
  const customerAddress = [
    order.address?.fullName ? `${order.address.fullName}, ` : "",
    order.address?.houseNumber,
    order.address?.street,
    order.address?.area,
    order.address?.landmark,
    order.address?.city,
    order.address?.state,
    order.address?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  const handlingCharge = (order as { handlingCharge?: number }).handlingCharge ?? 9;

  // Calculate items with GST breakdown
  let totalQty = 0;
  let totalTaxable = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalDiscount = order.offerDiscount ?? 0;

  const itemRows = order.items.map((item, index) => {
    const qty = item.quantity || 1;
    totalQty += qty;

    const mrp = item.product.mrp || item.product.price;
    const price = item.product.price;
    const discount = Math.max(mrp - price, 0) * qty;
    totalDiscount += discount;

    const lineTotal = price * qty;
    // GST @ 18% inclusive
    const taxableVal = +(lineTotal / 1.18).toFixed(2);
    const cgst = +((taxableVal * 0.09).toFixed(2));
    const sgst = +((taxableVal * 0.09).toFixed(2));

    totalTaxable += taxableVal;
    totalCGST += cgst;
    totalSGST += sgst;

    const upc =
      item.product.barcode ||
      item.product.sku ||
      `890${(1000000000 + index * 12345).toString().slice(0, 10)}`;

    return {
      sr: index + 1,
      upc,
      name: item.product.name,
      hsn: "21050000",
      mrp: mrp.toFixed(2),
      discount: discount.toFixed(2),
      qty,
      taxableVal: taxableVal.toFixed(2),
      cgstRate: "9.00",
      cgstVal: cgst.toFixed(2),
      sgstRate: "9.00",
      sgstVal: sgst.toFixed(2),
      cessRate: "0.00",
      cessVal: "0.00",
      total: lineTotal.toFixed(2),
    };
  });

  // Include handling charge row if present
  if (handlingCharge > 0) {
    const hcTaxable = +(handlingCharge / 1.18).toFixed(2);
    const hcCgst = +((hcTaxable * 0.09).toFixed(2));
    const hcSgst = +((hcTaxable * 0.09).toFixed(2));

    totalQty += 1;
    totalTaxable += hcTaxable;
    totalCGST += hcCgst;
    totalSGST += hcSgst;

    itemRows.push({
      sr: itemRows.length + 1,
      upc: "998549",
      name: "Handling charge",
      hsn: "998549",
      mrp: handlingCharge.toFixed(2),
      discount: "0.00",
      qty: 1,
      taxableVal: hcTaxable.toFixed(2),
      cgstRate: "9.00",
      cgstVal: hcCgst.toFixed(2),
      sgstRate: "9.00",
      sgstVal: hcSgst.toFixed(2),
      cessRate: "0.00",
      cessVal: "0.00",
      total: handlingCharge.toFixed(2),
    });
  }

  const grandTotal = order.totalAmount;
  const amountWords = numberToWords(grandTotal);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-2 sm:p-4 backdrop-blur-xs">
      <div className="relative my-auto w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        {/* Top Modal Bar */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3.5 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 sm:text-base">
              Tax Invoice — #{order.orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#15803D] active:scale-95"
            >
              <Printer size={15} />
              Print / Save PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:scale-95"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          id="tax-invoice-printable"
          className="max-h-[82vh] overflow-y-auto p-3 text-black sm:p-6 print:max-h-none print:overflow-visible print:p-0"
        >
          {/* Outer Border Box matching PDF */}
          <div className="border border-black bg-white font-sans text-black shadow-xs">
            {/* Header: Logo and Title */}
            <div className="flex items-center justify-between border-b border-black px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="text-3xl font-black tracking-tight text-black sm:text-4xl">
                  boot<span className="text-[#16A34A]">kit</span>
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-black sm:text-3xl">
                Tax Invoice
              </h1>
            </div>

            {/* Sold By / Seller & Order Metadata */}
            <div className="grid grid-cols-1 border-b border-black sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-black">
              {/* Sold By Left Box */}
              <div className="p-3 text-[11px] leading-tight space-y-1">
                <p className="font-bold text-[12px]">Sold By / Seller</p>
                <p className="font-bold text-[11px]">
                  BOOTKIT COMTRADE PRIVATE LIMITED
                </p>
                <p className="text-gray-800">
                  Bootkit - Jaipur Kusum Vihar Jagatpura ES44
                </p>
                <p className="text-gray-800">
                  D -74 ,75 Skit Road, Kusum Vihar, Jagatpura Jaipur 302017
                </p>
                <p className="text-gray-800">Jaipur</p>
                <p className="text-gray-800">302017</p>

                <div className="pt-2 space-y-0.5 font-medium">
                  <div className="flex">
                    <span className="w-40 font-bold">GSTIN</span>
                    <span>: 08ABHCS8002R1ZQ</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-bold">FSSAI License Number</span>
                    <span>: 13323999000038</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-bold">CIN</span>
                    <span>: U51900DL2022PTC393329</span>
                  </div>
                  <div className="flex">
                    <span className="w-40 font-bold">PAN</span>
                    <span>: ABHCS8002R</span>
                  </div>
                </div>
              </div>

              {/* Right QR & Order Meta Box */}
              <div className="p-3 flex flex-col justify-between text-[11px] space-y-3">
                <div className="flex items-start justify-end gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-18 w-18 items-center justify-center border border-black bg-white p-1">
                      <svg
                        viewBox="0 0 100 100"
                        className="h-full w-full"
                        fill="currentColor"
                      >
                        <path d="M0 0h30v30H0zm5 5h20v20H5zM10 10h10v10H10zM70 0h30v30H70zm5 5h20v20H75zM80 10h10v10H80zM0 70h30v30H0zm5 5h20v20H5zM10 80h10v10H10zM40 10h10v10H40zm10 10h10v10H50zm-10 10h10v10H40zm20 10h10v10H60zm-20 20h10v10H40zm20 0h10v10H60zm10-10h10v10H70zm0 20h10v10H70zm10 10h10v10H80zm-40 0h10v10H40zm10 10h10v10H50z" />
                      </svg>
                    </div>
                    <p className="mt-1 text-[9px] font-medium text-gray-700 text-center">
                      Invoice Number : {invoiceNumber}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] font-medium pt-2 border-t border-gray-200">
                  <div className="flex">
                    <span className="w-32 font-bold">Order Id</span>
                    <span className="font-bold">: {order.orderNumber}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Invoice Date</span>
                    <span>: {formattedDate}</span>
                  </div>
                  <div className="flex">
                    <span className="w-32 font-bold">Place of Supply</span>
                    <span>: {stateName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Section: Invoice To */}
            <div className="border-b border-black p-3 text-[11px] space-y-1 leading-tight">
              <p className="font-bold text-[12px]">Invoice To</p>
              <div className="space-y-0.5">
                <div className="flex">
                  <span className="w-20 font-bold shrink-0">Name</span>
                  <span className="font-bold">: {customerName}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold shrink-0">Address</span>
                  <span>: {customerAddress}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold shrink-0">Pin code</span>
                  <span>: {pincode}</span>
                </div>
                <div className="flex">
                  <span className="w-20 font-bold shrink-0">State</span>
                  <span>: {stateName}</span>
                </div>
              </div>
            </div>

            {/* Items Table with exact columns from PDF */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[9.5px] leading-tight text-black text-left">
                <thead>
                  <tr className="border-b border-black bg-gray-50 text-center font-bold">
                    <th className="border-r border-black p-1.5 w-7">Sr. no</th>
                    <th className="border-r border-black p-1.5 w-16">UPC</th>
                    <th className="border-r border-black p-1.5 text-left min-w-[140px]">
                      Item Description
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-14">
                      MRP
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-12">
                      Discount
                    </th>
                    <th className="border-r border-black p-1.5 text-center w-8">
                      Qty.
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-16">
                      Taxable Value
                    </th>
                    <th className="border-r border-black p-1.5 text-center w-12">
                      CGST (%)
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-14">
                      CGST (INR)
                    </th>
                    <th className="border-r border-black p-1.5 text-center w-12">
                      SGST (%)
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-14">
                      SGST (INR)
                    </th>
                    <th className="border-r border-black p-1.5 text-center w-10">
                      Cess (%)
                    </th>
                    <th className="border-r border-black p-1.5 text-right w-16">
                      Additional Cess Val
                    </th>
                    <th className="p-1.5 text-right w-16">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  {itemRows.map((row) => (
                    <tr key={row.sr} className="align-top">
                      <td className="border-r border-black p-1.5 text-center font-medium">
                        {row.sr}
                      </td>
                      <td className="border-r border-black p-1.5 font-mono text-[8.5px] break-all">
                        {row.upc}
                      </td>
                      <td className="border-r border-black p-1.5">
                        <p className="font-bold text-gray-950">{row.name}</p>
                        <p className="text-[8.5px] text-gray-600">
                          (HSN-{row.hsn})
                        </p>
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-medium">
                        {row.mrp}
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-medium">
                        {row.discount}
                      </td>
                      <td className="border-r border-black p-1.5 text-center font-bold">
                        {row.qty}
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-medium">
                        {row.taxableVal}
                      </td>
                      <td className="border-r border-black p-1.5 text-center">
                        {row.cgstRate}
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-medium">
                        {row.cgstVal}
                      </td>
                      <td className="border-r border-black p-1.5 text-center">
                        {row.sgstRate}
                      </td>
                      <td className="border-r border-black p-1.5 text-right font-medium">
                        {row.sgstVal}
                      </td>
                      <td className="border-r border-black p-1.5 text-center">
                        {row.cessRate}
                      </td>
                      <td className="border-r border-black p-1.5 text-right">
                        {row.cessVal}
                      </td>
                      <td className="p-1.5 text-right font-bold text-gray-950">
                        {row.total}
                      </td>
                    </tr>
                  ))}

                  {/* Summary Totals Row */}
                  <tr className="border-t-2 border-black bg-gray-50 font-bold text-black">
                    <td
                      colSpan={3}
                      className="border-r border-black p-1.5 text-left uppercase"
                    >
                      Total
                    </td>
                    <td className="border-r border-black p-1.5 text-right"></td>
                    <td className="border-r border-black p-1.5 text-right"></td>
                    <td className="border-r border-black p-1.5 text-center">
                      {totalQty}
                    </td>
                    <td className="border-r border-black p-1.5 text-right">
                      {totalTaxable.toFixed(2)}
                    </td>
                    <td className="border-r border-black p-1.5 text-center"></td>
                    <td className="border-r border-black p-1.5 text-right">
                      {totalCGST.toFixed(2)}
                    </td>
                    <td className="border-r border-black p-1.5 text-center"></td>
                    <td className="border-r border-black p-1.5 text-right">
                      {totalSGST.toFixed(2)}
                    </td>
                    <td className="border-r border-black p-1.5 text-center"></td>
                    <td className="border-r border-black p-1.5 text-right"></td>
                    <td className="p-1.5 text-right text-[10.5px]">
                      {grandTotal.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount in Words */}
            <div className="border-b border-black p-2.5 text-[11px] font-bold">
              <span>Amount in Words: </span>
              <span className="font-bold text-black">{amountWords}</span>
            </div>

            {/* Platform Company Meta & Signature Box */}
            <div className="grid grid-cols-1 border-b border-black sm:grid-cols-[1.5fr_1fr] divide-y sm:divide-y-0 sm:divide-x divide-black">
              <div className="p-3 text-[10.5px] space-y-1.5">
                <p className="font-bold">
                  Bootkit Commerce Private Limited (formerly known as Grofers India Private Limited)
                </p>
                <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2">
                  <div className="space-y-0.5">
                    <p>
                      <span className="font-bold">GSTIN:</span> 08AAFCG9846E1ZB
                    </p>
                    <p>
                      <span className="font-bold">CIN:</span> U74140HR2015FTC055568
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p>
                      <span className="font-bold">FSSAI License Number:</span> 10018064001545
                    </p>
                    <p>
                      <span className="font-bold">PAN:</span> AAFCG9846E
                    </p>
                  </div>
                </div>
              </div>

              {/* Signature */}
              <div className="p-3 flex flex-col justify-end items-center text-center">
                {/* Stylized signature */}
                <div className="h-12 w-32 flex items-center justify-center">
                  <svg
                    viewBox="0 0 160 50"
                    className="h-full w-full stroke-gray-900"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M 10 35 C 25 10, 30 45, 45 20 C 55 5, 65 30, 80 25 C 95 20, 105 35, 120 15 C 130 5, 140 40, 150 25" />
                    <path d="M 20 40 L 140 38" />
                  </svg>
                </div>
                <p className="text-[10px] font-bold text-gray-800 border-t border-gray-300 pt-1 w-full text-center">
                  Authorised Signatory
                </p>
              </div>
            </div>

            {/* Reverse Charge */}
            <div className="border-b border-black px-3 py-1 text-[10px] font-bold">
              Whether the tax is payable on reverse charge - No
            </div>

            {/* Terms & Conditions */}
            <div className="p-3 text-[9px] leading-snug space-y-1 text-gray-800">
              <p className="font-bold text-[10px] text-black">
                Terms & Conditions:
              </p>
              <p>
                1. If you have any issues or queries in respect of your order, please contact customer chat support through Bootkit platform or drop in email at{" "}
                <span className="font-medium text-black">support@bootkit.in</span>
              </p>
              <p>
                2. In case you need to get more information about seller's or Bootkit's FSSAI status, please visit{" "}
                <span className="underline">https://foscos.fssai.gov.in/</span> and use the FBO search option with FSSAI License / Registration number.
              </p>
              <p>
                3. Please note that we never ask for bank account details such as CVV, account number, UPI Pin, etc. across our support channels. For your safety please do not share these details with anyone over any medium.
              </p>
            </div>
          </div>
        </div>

        {/* Global Print Styling */}
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
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
