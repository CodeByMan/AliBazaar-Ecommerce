export const ProductGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7.5 gap-y-9" aria-label="Loading products">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="animate-pulse">
        <div className="rounded-lg bg-gray-2 min-h-[270px] mb-4" />
        <div className="h-4 w-24 rounded bg-gray-2 mb-3" />
        <div className="h-5 w-3/4 rounded bg-gray-2 mb-3" />
        <div className="h-5 w-28 rounded bg-gray-2" />
      </div>
    ))}
  </div>
);

export const ProductLoadError = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) => (
  <div className="rounded-lg bg-white shadow-1 px-6 py-10 text-center">
    <h3 className="font-semibold text-lg text-dark mb-2">Products could not be loaded</h3>
    <p className="mb-5">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex font-medium text-white bg-blue py-2.5 px-6 rounded-md ease-out duration-200 hover:bg-blue-dark"
      >
        Try again
      </button>
    )}
  </div>
);

export const EmptyProducts = ({ message = "No products were found." }) => (
  <div className="rounded-lg bg-white shadow-1 px-6 py-10 text-center">
    <h3 className="font-semibold text-lg text-dark mb-2">No products found</h3>
    <p>{message}</p>
  </div>
);
