import type { Metadata } from "next";
import { Inter, Barlow_Condensed, Geist_Mono } from "next/font/google";
import { MotionConfig } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { JoinRequestsProvider } from "@/lib/join-requests";
import { RegistrationsProvider } from "@/lib/registrations";
import { TournamentStatusProvider } from "@/lib/tournament-status";
import { HostedTournamentsProvider } from "@/lib/hosted-tournaments";
import { TournamentAssistantsProvider } from "@/lib/tournament-assistants";
import { PlayerRatingsProvider } from "@/lib/player-ratings";
import { HostingPlansProvider } from "@/lib/hosting-plans";
import { MembershipProvider } from "@/lib/membership";
import { NotificationsProvider } from "@/lib/notifications";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-heading",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpinTTRatings",
  description: "Rated on talent. Not age or gender.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${barlowCondensed.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionConfig reducedMotion="user">
          <AuthProvider>
            <JoinRequestsProvider>
              <RegistrationsProvider>
                <TournamentStatusProvider>
                  <HostedTournamentsProvider>
                    <TournamentAssistantsProvider>
                      <PlayerRatingsProvider>
                        <HostingPlansProvider>
                          <MembershipProvider>
                            <NotificationsProvider>
                              <TooltipProvider delay={200}>
                                {children}
                                <Toaster />
                              </TooltipProvider>
                            </NotificationsProvider>
                          </MembershipProvider>
                        </HostingPlansProvider>
                      </PlayerRatingsProvider>
                    </TournamentAssistantsProvider>
                  </HostedTournamentsProvider>
                </TournamentStatusProvider>
              </RegistrationsProvider>
            </JoinRequestsProvider>
          </AuthProvider>
        </MotionConfig>
      </body>
    </html>
  );
}
