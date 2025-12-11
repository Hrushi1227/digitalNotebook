export default function PageHeader({ title, extra }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div>{extra}</div>
    </div>
  );
}
