"use client";

import { useEffect, useRef, useState } from "react";

type CheckoutItem = { productId: string; quantity: number };

type ApprovedResult = { orderNumber: string; whatsappUrl: string };

type Props = {
  amount: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  items: CheckoutItem[];
  onApproved: (result: ApprovedResult) => void;
  onClose: () => void;
};

type PaymentResult = {
  orderId: string;
  orderNumber: string;
  paymentId: string;
  status?: string | null;
  statusDetail?: string | null;
  threeDsInfo?: { external_resource_url?: string; creq?: string } | null;
  whatsappUrl?: string;
  approved?: boolean;
  stockDeducted?: boolean;
  error?: string;
};

declare global {
  interface Window {
    MercadoPago?: any;
  }
}

const SDK_ID = "mercado-pago-sdk-v2";

function loadMercadoPagoSdk() {
  return new Promise<void>((resolve, reject) => {
    if (window.MercadoPago) return resolve();
    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Não foi possível carregar o Mercado Pago.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_ID;
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Não foi possível carregar o Mercado Pago."));
    document.head.appendChild(script);
  });
}

export default function MercadoPagoCheckout({ amount, customerName, customerPhone, customerEmail, items, onApproved, onClose }: Props) {
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"loading" | "payment" | "status">("loading");
  const [orderId, setOrderId] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentState, setPaymentState] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const paymentController = useRef<any>(null);
  const statusController = useRef<any>(null);
  const approvedHandled = useRef(false);

  const finishApprovedPayment = async (result: ApprovedResult) => {
    if (approvedHandled.current) return;
    approvedHandled.current = true;
    setPaymentState("approved");

    // O Status Screen do Mercado Pago pode tentar se atualizar no mesmo instante
    // em que o webhook confirma o Pix. Desmontamos o Brick antes de trocar a tela
    // do carrinho para evitar uma disputa de renderização durante a aprovação.
    if (statusController.current) {
      const controller = statusController.current;
      statusController.current = null;
      try {
        await controller.unmount();
      } catch {
        // A aprovação do servidor é a fonte de verdade; falha ao desmontar a UI não bloqueia o pedido.
      }
    }

    onApproved(result);
  };

  useEffect(() => {
    let cancelled = false;
    const publicKey = process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY;
    if (!publicKey) {
      setError("Public Key do Mercado Pago não configurada.");
      return;
    }

    const start = async () => {
      try {
        await loadMercadoPagoSdk();
        if (cancelled || !window.MercadoPago) return;
        const mp = new window.MercadoPago(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks({ theme: "dark" });
        setMode("payment");

        await new Promise((resolve) => setTimeout(resolve, 0));
        if (cancelled) return;

        paymentController.current = await bricksBuilder.create("payment", "paymentBrick_container", {
          initialization: {
            amount,
            payer: customerEmail ? { email: customerEmail } : undefined,
          },
          customization: {
            paymentMethods: {
              bankTransfer: "pix",
              creditCard: "all",
              debitCard: "all",
              minInstallments: 1,
              maxInstallments: 12,
            },
            visual: { style: { theme: "dark" } },
          },
          callbacks: {
            onReady: () => setError(""),
            onSubmit: ({ formData }: { selectedPaymentMethod?: string; formData: Record<string, unknown> }) => {
              return new Promise<void>(async (resolve, reject) => {
                try {
                  setError("");
                  const response = await fetch("/api/mercadopago/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ customerName, customerPhone, customerEmail, items, formData }),
                  });
                  const result = (await response.json()) as PaymentResult;
                  if (!response.ok) throw new Error(result.error || "Não foi possível criar o pagamento.");

                  setOrderId(result.orderId);
                  setOrderNumber(result.orderNumber);
                  setWhatsappUrl(result.whatsappUrl || "");
                  setPaymentState(String(result.status || "em processamento"));
                  setMode("status");

                  if (paymentController.current) {
                    await paymentController.current.unmount();
                    paymentController.current = null;
                  }

                  await new Promise((done) => setTimeout(done, 0));
                  const initialization: Record<string, unknown> = { paymentId: result.paymentId };
                  if (result.statusDetail === "pending_challenge" && result.threeDsInfo?.external_resource_url && result.threeDsInfo?.creq) {
                    initialization.additionalInfo = {
                      externalResourceURL: result.threeDsInfo.external_resource_url,
                      creq: result.threeDsInfo.creq,
                    };
                  }

                  statusController.current = await bricksBuilder.create("statusScreen", "statusScreenBrick_container", {
                    initialization,
                    customization: { visual: { showExternalReference: true, style: { theme: "dark" } } },
                    callbacks: {
                      onReady: () => {},
                      onError: (statusError: unknown) => console.error("Mercado Pago Status Screen", statusError),
                    },
                  });

                  if (result.approved && result.stockDeducted) {
                    await finishApprovedPayment({ orderNumber: result.orderNumber, whatsappUrl: result.whatsappUrl || "" });
                  }
                  resolve();
                } catch (submissionError) {
                  const message = submissionError instanceof Error ? submissionError.message : "Não foi possível processar o pagamento.";
                  setError(message);
                  reject(submissionError);
                }
              });
            },
            onError: (brickError: unknown) => {
              console.error("Mercado Pago Payment Brick", brickError);
              setError("O checkout encontrou um erro. Tente novamente.");
            },
          },
        });
      } catch (sdkError) {
        setError(sdkError instanceof Error ? sdkError.message : "Não foi possível iniciar o Mercado Pago.");
      }
    };

    start();
    return () => {
      cancelled = true;
      if (paymentController.current) paymentController.current.unmount().catch(() => {});
      if (statusController.current) statusController.current.unmount().catch(() => {});
    };
  }, [amount, customerName, customerPhone, customerEmail, items, onApproved]);

  useEffect(() => {
    if (!orderId) return;
    let active = true;

    const refresh = async () => {
      try {
        const response = await fetch(`/api/mercadopago/status?orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        if (!response.ok || !active) return;
        const result = await response.json();
        const latestState = String(result.paymentStatus || "em processamento");
        setPaymentState(latestState);
        const latestWhatsappUrl = result.whatsappUrl ? String(result.whatsappUrl) : whatsappUrl;
        if (result.whatsappUrl) setWhatsappUrl(latestWhatsappUrl);
        if (result.approved && result.stockDeducted) {
          await finishApprovedPayment({ orderNumber: String(result.orderNumber || orderNumber), whatsappUrl: latestWhatsappUrl });
        }
      } catch {
        // O Status Screen continua funcionando mesmo se uma consulta temporária falhar.
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 4000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [orderId, orderNumber, whatsappUrl, onApproved]);

  const paymentApproved = paymentState.toLowerCase() === "approved" || paymentState.toLowerCase() === "aprovado";

  return (
    <div className="mt-4 rounded-2xl border border-blue-500/30 bg-zinc-950 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-blue-400">Mercado Pago</p>
          <h2 className="mt-1 text-xl font-black">{mode === "status" ? `Pedido ${orderNumber}` : "Pagamento seguro"}</h2>
          {mode === "status" ? <p className="mt-1 text-sm text-zinc-400">Status: {paymentState || "em processamento"}</p> : null}
        </div>
        {mode !== "status" ? <button type="button" onClick={onClose} className="rounded-lg border border-zinc-700 px-3 py-2 text-sm font-bold hover:bg-zinc-800">Fechar</button> : null}
      </div>

      {error ? <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-300">{error}</p> : null}
      {mode === "loading" ? <p className="py-8 text-center text-sm text-zinc-400">Carregando checkout seguro...</p> : null}
      <div id="paymentBrick_container" className={mode === "payment" ? "block" : "hidden"} />
      <div id="statusScreenBrick_container" className={mode === "status" && !paymentApproved ? "block" : "hidden"} />

      {mode === "status" && whatsappUrl ? (
        <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 p-4">
          {paymentApproved ? (
            <>
              <p className="text-sm leading-6 text-zinc-300">Pagamento confirmado pelo servidor. Se desejar, envie também a confirmação manual do pedido ao vendedor.</p>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex rounded-lg bg-green-600 px-4 py-2.5 text-sm font-black text-white hover:bg-green-500">Confirmar pedido pelo WhatsApp</a>
            </>
          ) : (
            <>
              <p className="text-sm leading-6 text-zinc-300">A confirmação manual pelo WhatsApp será liberada somente depois que o Mercado Pago confirmar o pagamento.</p>
              <button type="button" disabled className="mt-3 inline-flex cursor-not-allowed rounded-lg bg-zinc-700 px-4 py-2.5 text-sm font-black text-zinc-400 opacity-70">Aguardando confirmação do pagamento</button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
