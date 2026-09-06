"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type MercadoPagoInstance = {
  bricks: () => {
    create: (name: string, container: string, settings: Record<string, unknown>) => Promise<{ unmount: () => Promise<void> | void }>;
  };
};

type CheckoutProps = {
  orderId: string;
  orderNumber: string;
  amount: number;
  customerEmail?: string | null;
  publicKey: string;
  onApproved: (whatsappUrl: string) => void;
};

type PaymentResult = {
  paymentId?: string | number;
  status?: string;
  statusDetail?: string;
  whatsappUrl?: string;
  threeDsInfo?: { externalResourceURL?: string; creq?: string };
  pix?: { qrCode?: string; qrCodeBase64?: string; ticketUrl?: string };
  error?: string;
};

declare global {
  interface Window {
    MercadoPago?: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
  }
}

export default function MercadoPagoCheckout({ orderId, orderNumber, amount, customerEmail, publicKey, onApproved }: CheckoutProps) {
  const paymentController = useRef<{ unmount: () => Promise<void> | void } | null>(null);
  const statusController = useRef<{ unmount: () => Promise<void> | void } | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [message, setMessage] = useState("Carregando checkout seguro...");
  const [pix, setPix] = useState<PaymentResult["pix"] | null>(null);
  const [approvedUrl, setApprovedUrl] = useState("");

  const stopPolling = () => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = null;
  };

  const confirmApproved = (url: string) => {
    stopPolling();
    setApprovedUrl(url);
    setMessage("Pagamento aprovado. Pedido confirmado!");
    onApproved(url);
  };

  const pollPayment = (paymentId: string | number) => {
    stopPolling();
    let checks = 0;
    pollTimer.current = setInterval(async () => {
      checks += 1;
      try {
        const response = await fetch(`/api/payments/status?paymentId=${encodeURIComponent(String(paymentId))}&orderId=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const result = (await response.json()) as PaymentResult;
        if (result.status === "approved" && result.whatsappUrl) confirmApproved(result.whatsappUrl);
        else if (["rejected", "cancelled", "refunded", "charged_back"].includes(String(result.status))) {
          stopPolling();
          setMessage("O pagamento não foi aprovado. Você pode tentar novamente.");
        } else if (checks >= 60) {
          stopPolling();
          setMessage("Pagamento ainda em processamento. Você pode verificar novamente em alguns instantes.");
        }
      } catch {
        if (checks >= 60) stopPolling();
      }
    }, 3000);
  };

  const renderStatusScreen = async (mp: MercadoPagoInstance, result: PaymentResult) => {
    if (!result.paymentId || !result.threeDsInfo?.externalResourceURL || !result.threeDsInfo?.creq) return;
    await paymentController.current?.unmount();
    paymentController.current = null;
    setMessage("Autenticação 3DS solicitada pelo banco. Conclua a verificação abaixo.");
    const bricksBuilder = mp.bricks();
    statusController.current = await bricksBuilder.create("statusScreen", "statusScreenBrick_container", {
      initialization: {
        paymentId: String(result.paymentId),
        additionalInfo: {
          externalResourceURL: result.threeDsInfo.externalResourceURL,
          creq: result.threeDsInfo.creq,
        },
      },
      callbacks: {
        onReady: () => setMessage("Conclua a autenticação do seu banco para finalizar o pagamento."),
        onError: () => setMessage("Não foi possível abrir a autenticação 3DS. Tente novamente."),
      },
    });
    pollPayment(result.paymentId);
  };

  useEffect(() => {
    const MercadoPago = window.MercadoPago;
    if (!sdkReady || !MercadoPago || !publicKey) return;
    let cancelled = false;

    const setup = async () => {
      try {
        const mp = new MercadoPago(publicKey, { locale: "pt-BR" });
        const bricksBuilder = mp.bricks();
        const controller = await bricksBuilder.create("payment", "paymentBrick_container", {
          initialization: {
            amount,
            payer: customerEmail ? { email: customerEmail } : undefined,
          },
          customization: {
            paymentMethods: {
              creditCard: "all",
              debitCard: "all",
              prepaidCard: "all",
              bankTransfer: "pix",
              minInstallments: 1,
              maxInstallments: 12,
            },
          },
          callbacks: {
            onReady: () => setMessage("Escolha Pix ou cartão. No crédito, selecione uma das parcelas disponíveis para o cartão informado."),
            onSubmit: ({ formData }: { formData: Record<string, unknown> }) =>
              new Promise<void>(async (resolve, reject) => {
                try {
                  setMessage("Processando pagamento...");
                  setPix(null);
                  const response = await fetch("/api/payments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId, requestId: crypto.randomUUID(), formData }),
                  });
                  const result = (await response.json()) as PaymentResult;
                  if (!response.ok) throw new Error(result.error || "Não foi possível processar o pagamento.");

                  if (result.status === "approved" && result.whatsappUrl) {
                    confirmApproved(result.whatsappUrl);
                  } else if (result.statusDetail === "pending_challenge") {
                    await renderStatusScreen(mp, result);
                  } else if (result.pix?.qrCode || result.pix?.qrCodeBase64) {
                    setPix(result.pix);
                    setMessage("Pix gerado. Faça o pagamento e aguarde a confirmação automática.");
                    if (result.paymentId) pollPayment(result.paymentId);
                  } else if (result.paymentId) {
                    setMessage("Pagamento em processamento. Aguardando confirmação do Mercado Pago.");
                    pollPayment(result.paymentId);
                  }
                  resolve();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Falha ao processar pagamento.");
                  reject(error);
                }
              }),
            onError: () => setMessage("O checkout encontrou um erro. Revise os dados e tente novamente."),
          },
        });
        if (cancelled) await controller.unmount();
        else paymentController.current = controller;
      } catch {
        setMessage("Não foi possível carregar o checkout do Mercado Pago.");
      }
    };

    setup();
    return () => {
      cancelled = true;
      stopPolling();
      void paymentController.current?.unmount();
      void statusController.current?.unmount();
    };
  }, [sdkReady, publicKey, amount, customerEmail, orderId]);

  if (!publicKey) {
    return <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">Checkout Mercado Pago aguardando a configuração da chave pública.</div>;
  }

  return (
    <section className="space-y-4">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-100">
        <strong>Pedido {orderNumber}</strong><br />Pagamento protegido pelo Mercado Pago. Cartões podem solicitar autenticação 3DS 2.0 pelo banco emissor.
      </div>
      <p className="text-sm font-semibold text-zinc-300">{message}</p>
      <div id="paymentBrick_container" />
      <div id="statusScreenBrick_container" />
      {pix ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <h3 className="font-black text-emerald-300">Pague com Pix</h3>
          {pix.qrCodeBase64 ? <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code Pix" className="mx-auto mt-4 w-64 rounded-xl bg-white p-3" /> : null}
          {pix.qrCode ? <textarea readOnly value={pix.qrCode} className="mt-4 h-28 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-xs" onFocus={(e) => e.currentTarget.select()} /> : null}
          {pix.qrCode ? <button type="button" onClick={() => navigator.clipboard.writeText(pix.qrCode || "")} className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-black hover:bg-emerald-500">Copiar código Pix</button> : null}
        </div>
      ) : null}
      {approvedUrl ? <a href={approvedUrl} target="_blank" rel="noreferrer" className="block rounded-xl bg-green-600 px-5 py-4 text-center font-black hover:bg-green-500">Enviar confirmação do pedido ao vendedor no WhatsApp</a> : null}
    </section>
  );
}
