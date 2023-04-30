import React from "react";
import Head from "next/head";
import styles from "./styles-layout.module.css";
import Link from "next/link";

interface LayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function Layout({ title, children }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title ? title + " - Weather.io" : "Weather.io"}</title>
        <meta name="description" content="An faboulus weather website" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <header className="bg-[#2d3142] p-2 flex justify-around items-center text-white">
        <a className={styles.navbarA} href="/">
          Home
        </a>
        <a className={styles.navbarA}>Location Settings</a>
        <h1 className="text-base font-semibold md:font-normal md:text-4xl">
            <a href="/">
                Weather.io
            </a>
        </h1>
        <Link className={styles.navbarA} href="/settings">
          Settings
        </Link>
        <a className={styles.navbarA} href="/contactus">
          Contact Us
        </a>
      </header>
      <main className="min-h-screen">{children}</main>
      <footer className="absolute w-full pt-8 bg-[#2d3142] text-white text-2xl">
        <div className="mb-3 ml-3">© - Weather.io</div>
      </footer>
    </>
  );
}
