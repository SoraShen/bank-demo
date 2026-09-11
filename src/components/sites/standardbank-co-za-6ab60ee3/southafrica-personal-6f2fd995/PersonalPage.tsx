"use client";

import {
  ArrowsClockwise,
  Bank,
  DownloadSimple,
  FileText,
  HandCoins,
  Lightning,
  LockSimple,
  MagnifyingGlass,
  PiggyBank,
  ShieldPlus,
  ShoppingBag,
} from "@phosphor-icons/react";
import { useState } from "react";
import { Logo } from "../shared/Logo";
import "./site.css";

const IMG = "/sites/standardbank-co-za-6ab60ee3/southafrica-personal-6f2fd995/images";
const SHARE = "/sites/standardbank-co-za-6ab60ee3/shared";

const SLIDES = [
  {
    title: "Win* 4 VIP tickets to MTN8 Final",
    body: "Buy MTN airtime or data worth R100 or more from our digital channels and stand to win*.",
    cta: "BUY NOW",
    href: "https://sbg.onelink.me/PCD3/61pvkpdz",
    img: `${IMG}/hero-mtn8.jpg`,
    alt: "MTN Banner",
  },
  {
    title: "Introducing the Galaxy Z Series 8",
    body: "Shop the latest lineup and get a free wireless battery pack, 45W fast charger, and a R1 000 Dress Your Tech voucher.",
    cta: "SHOP NOW",
    href: "https://connect.standardbank.co.za/",
    img: `${IMG}/hero-samsung.jpg`,
    alt: "Samsung zfold8 banner image",
  },
  {
    title: "Flexible cover for life's turns",
    body: "Get life cover of up to R1 million. No medical questions for cover up to R300 000. Apply for the Flexible Life Plan today.",
    cta: "GET QUOTE",
    href: "https://www.standardbank.co.za/southafrica/personal/products-and-services/insure-what-matters/yourself/flexible-life-plan",
    img: `${IMG}/hero-life.jpg`,
    alt: "Flexible Life Plan",
  },
  {
    title: "A better way to play Lotto",
    body: "New games and more ways to win, exclusively on your Banking App. Not for persons under 18 and winners know when to stop.",
    cta: "TELL ME MORE",
    href: "https://www.standardbank.co.za/southafrica/personal",
    img: `${IMG}/hero-lotto.jpg`,
    alt: "New Lotto Personal Hero",
  },
  {
    title: "Meet SB SafeGuard",
    body: "Your trusted guide to money safety, here to help you spot scams and protect your information.",
    cta: "TELL ME MORE",
    href: "https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre",
    img: `${IMG}/hero-safeguard.jpg`,
    alt: "SB Guard Personal Hero",
  },
];

const TABS = [
  { id: "Bank", icon: Bank },
  { id: "Borrow", icon: HandCoins },
  { id: "Save", icon: PiggyBank },
  { id: "Insure", icon: ShieldPlus },
  { id: "Buy", icon: ShoppingBag },
];

const CARDS = [
  {
    title: "Everyday banking",
    body: "Enjoy affordable banking that lets you save money while still getting the full banking experience.",
    img: `${IMG}/card-everyday.jpg`,
    href: "https://www.standardbank.co.za/southafrica/personal/products-and-services/bank-with-us/bank-accounts",
  },
  {
    title: "Private banking",
    body: "As Africa’s best Private Bank, we’ll give you access to an exclusive banking experience with a comprehensive suite of benefits.",
    img: `${IMG}/card-private.jpg`,
    href: "https://www.standardbank.co.za/southafrica/personal",
  },
  {
    title: "Youth banking",
    body: "Whether you're a student, entering the job market, or need a bank account for your kids under 16, we've got you covered.",
    img: `${IMG}/card-youth.jpg`,
    href: "https://www.standardbank.co.za/southafrica/personal",
  },
];

export function PersonalPage() {
  const [slide, setSlide] = useState(0);
  const [tab, setTab] = useState("Bank");
  const s = SLIDES[slide]!;

  return (
    <div className="sb-site">
      <div className="sb-top">
        <div className="sb-wrap sb-top__inner">
          <nav className="sb-top__left">
            <a className="is-on" href="https://www.standardbank.co.za/southafrica/personal" target="_blank" rel="noreferrer">
              Personal
            </a>
            <a href="https://www.standardbank.co.za/southafrica/business" target="_blank" rel="noreferrer">
              Business
            </a>
            <a href="https://corporateandinvestment.standardbank.com/" target="_blank" rel="noreferrer">
              Corporate and Institutions
            </a>
            <a href="https://wealthandinvestment.standardbank.com/wi/wealth-and-investment" target="_blank" rel="noreferrer">
              Wealth
            </a>
            <a href="https://www.standardbank.co.za/southafrica/news-and-media" target="_blank" rel="noreferrer">
              News and Media
            </a>
          </nav>
          <nav className="sb-top__right">
            <a href="https://www.standardbank.co.za/southafrica/personal/about-us" target="_blank" rel="noreferrer">
              About us
            </a>
            <a href="https://www.standardbank.co.za/southafrica/personal/branch-locator" target="_blank" rel="noreferrer">
              Locate Us
            </a>
            <a href="https://www.standardbank.co.za/southafrica/personal/contact-us" target="_blank" rel="noreferrer">
              Contact us
            </a>
            <span>
              <img className="sb-flag" src={`${SHARE}/sa-flag.png`} alt="" />
              South Africa
            </span>
          </nav>
        </div>
      </div>

      <div className="sb-nav">
        <div className="sb-wrap sb-nav__row">
          <Logo light />
          <nav className="sb-nav__links">
            <a href="https://www.standardbank.co.za/southafrica/personal/products-and-services" target="_blank" rel="noreferrer">
              Products and Services
            </a>
            <a href="https://ucount.standardbank.co.za/personal" target="_blank" rel="noreferrer">
              UCount Rewards
            </a>
            <a href="https://connect.standardbank.co.za/" target="_blank" rel="noreferrer">
              Standard Bank Connect
            </a>
            <a href="https://www.standardbank.co.za/southafrica/personal/learn" target="_blank" rel="noreferrer">
              Learn
            </a>
          </nav>
          <div className="sb-nav__tools">
            <button type="button" className="sb-search" aria-label="Search">
              <MagnifyingGlass size={22} />
            </button>
          </div>
        </div>
        <a className="sb-signin" href="https://www.standardbank.co.za/southafrica/personal" target="_blank" rel="noreferrer">
          <LockSimple size={18} weight="bold" />
          Sign in
        </a>
      </div>

      <section className="sb-hero">
        <img className="sb-hero__photo" src={s.img} alt={s.alt} />
        <div className="sb-hero__navy">
          <div className="sb-hero__copy">
            <h1>{s.title}</h1>
            <p>{s.body}</p>
            <a className="sb-hero__cta" href={s.href} target="_blank" rel="noreferrer">
              {s.cta}
            </a>
          </div>
        </div>
        <div className="sb-hero__dots">
          {SLIDES.map((_, i) => (
            <button key={i} type="button" className={i === slide ? "is-on" : ""} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="sb-wrap sb-today">
        <h2>What would you like to do today?</h2>
        <div className="sb-tabs">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={tab === t.id ? "is-on" : ""} onClick={() => setTab(t.id)}>
              <t.icon size={16} />
              {t.id}
            </button>
          ))}
        </div>
        <div className="sb-cards">
          {CARDS.map((c) => (
            <article key={c.title} className="sb-card">
              <img src={c.img} alt="" />
              <h3>{c.title}</h3>
              <p>{c.body}</p>
              <a className="sb-pill" href={c.href} target="_blank" rel="noreferrer">
                TELL ME MORE
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="sb-band">
        <div className="sb-band__copy">
          <h2>Stop fraud before it starts</h2>
          <p>Easily nominate a Trusted Person on your Banking App today to help review, confirm or decline payments initiated from your bank account.</p>
          <a className="sb-band__cta" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre" target="_blank" rel="noreferrer">
            TELL ME MORE
          </a>
        </div>
        <img src={`${IMG}/banner-trusted.jpg`} alt="Trusted person banner image" />
      </section>

      <section className="sb-helpband">
        <div>
          <h2>Looking for help? Visit the Help Centre</h2>
          <p>Find answers, step-by-step guides and banking support in one place.</p>
          <a className="sb-band__cta" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre" target="_blank" rel="noreferrer">
            GO TO HELP CENTRE
          </a>
        </div>
        <div className="sb-helpgrid">
          <a className="sb-helpcard" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre" target="_blank" rel="noreferrer">
            <FileText size={28} color="#0062e1" />
            <span>Verify an account number</span>
          </a>
          <a className="sb-helpcard" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre" target="_blank" rel="noreferrer">
            <DownloadSimple size={28} color="#0062e1" />
            <span>Get bank documents</span>
          </a>
          <a className="sb-helpcard" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre" target="_blank" rel="noreferrer">
            <ArrowsClockwise size={28} color="#0062e1" />
            <span>Reverse a debit order</span>
          </a>
          <a className="sb-helpcard" href="https://www.standardbank.co.za/southafrica/personal/products-and-services/ways-to-bank/help-centre" target="_blank" rel="noreferrer">
            <Lightning size={28} color="#0062e1" />
            <span>Make an immediate payment</span>
          </a>
        </div>
      </section>

      <section className="sb-ucount">
        <img src={`${IMG}/banner-ucount.jpg`} alt="Ucount homepage banner" />
        <div className="sb-ucount__copy">
          <h2>Swipe and earn with UCount Rewards</h2>
          <p>Get access to exclusive deals and specials with our loyalty programme for only R25 per month.</p>
          <a className="sb-hero__cta" href="https://ucount.standardbank.co.za/personal" target="_blank" rel="noreferrer">
            FIND OUT MORE
          </a>
        </div>
      </section>

      <footer className="sb-footer">
        <div className="sb-footer__left">
          <div className="sb-contacts">
            <h4>Fraud line - Report a NEW fraud incident</h4>
            <p>South Africa</p>
            <p>
              <a href="tel:0800222050">0800 222 050</a>
            </p>
            <p>International</p>
            <p>+27 10 824 2090</p>
            <h4>Personal Banking</h4>
            <p>South Africa</p>
            <p>
              <a href="tel:0860123000">0860 123 000</a>
            </p>
            <p>International</p>
            <p>+27 10 824 1515</p>
            <h4>Lost or stolen cards</h4>
            <p>South Africa</p>
            <p>
              <a href="tel:0800020600">0800 020 600</a>
            </p>
            <p>International</p>
            <p>+27 10 824 1514</p>
          </div>
        </div>
        <div className="sb-footer__right">
          <h4>Get to know us</h4>
          <a href="https://www.standardbank.co.za/southafrica/news-and-media" target="_blank" rel="noreferrer">
            News and media
          </a>
          <a href="https://www.standardbank.co.za/southafrica/personal/about-us" target="_blank" rel="noreferrer">
            Who we are
          </a>
          <a href="https://www.standardbank.co.za/southafrica/personal/branch-locator" target="_blank" rel="noreferrer">
            Find a branch
          </a>
          <a href="https://www.standardbank.co.za/southafrica/personal/products-and-services/security-centre" target="_blank" rel="noreferrer">
            Security Centre
          </a>
        </div>
        <p className="sb-legal">
          Standard Bank is a licensed financial services provider. Unauthorised demo — created by Huawei Cloud for demonstration purposes only.
        </p>
      </footer>
    </div>
  );
}
