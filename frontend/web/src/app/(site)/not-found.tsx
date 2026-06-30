import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-gray-2 py-16 sm:py-20">
      <div className="mx-auto flex min-h-[55vh] w-full max-w-[760px] flex-col items-center justify-center px-4 text-center sm:px-8">
        <Image
          src="/images/404.svg"
          alt="Page not found"
          width={520}
          height={320}
          className="h-auto w-full max-w-[480px]"
          priority
        />
        <h1 className="mt-8 text-3xl font-semibold text-dark sm:text-heading-4">
          404 — Page Not Found
        </h1>
        <p className="mt-3 max-w-xl text-dark-4">
          The page you requested does not exist, may have moved, or the URL is incorrect.
        </p>
        <div className="mt-7 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/"
            className="rounded-md bg-blue px-7 py-3 font-medium text-white hover:bg-blue-dark"
          >
            Return Home
          </Link>
          <Link
            href="/shop-with-sidebar"
            className="rounded-md border border-gray-3 bg-white px-7 py-3 font-medium text-dark hover:border-blue hover:text-blue"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </main>
  );
}
