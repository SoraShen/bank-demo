import type { Metadata } from "next";
import { ChatProvider } from "@/components/chatbot/ChatProvider";
import { ChatAssistant } from "@/components/chatbot/ChatAssistant";
import { DemoBar } from "@/components/demo/DemoBar";
import { WorkflowPanel } from "@/components/workflow/WorkflowPanel";
import { BankingAppHandoff } from "@/components/app-handoff/BankingAppHandoff";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bank · personal banking assistant demo",
  description:
    "Huawei demonstration of a retail-banking AI assistant. Not an official bank product and not authorised by any customer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChatProvider>
          <div className="sb-shell">
            <p id="hw-demo-note" style={{margin:0,padding:"8px 12px",background:"#111",color:"#eee",font:"11px/1.45 system-ui,sans-serif",textAlign:"center"}}>
              This is a Huawei-provided demonstration for the banking industry. It is not an official
              product of any bank or brand, and has not been authorised by any customer.{" "}
              <a href="mailto:shenbinchang@huawei.com" style={{color:"#9cf"}}>shenbinchang@huawei.com</a>
            </p>
            <DemoBar />
            <div className="sb-main">
              <div className="sb-sitepane">
                <div className="sb-site-scroll">{children}</div>
                <ChatAssistant />
              </div>
              <WorkflowPanel />
            </div>
          </div>
          <BankingAppHandoff />
        </ChatProvider>
      </body>
    </html>
  );
}
