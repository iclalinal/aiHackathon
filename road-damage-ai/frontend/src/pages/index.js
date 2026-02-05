import UploadForm from "../components/UploadForm";

export default function Home() {
  return (
    <div className="container">
      <h1>🚀 Yol Hasarı Şikayeti</h1>
      <p>Lütfen yol hasarını bildiriniz.</p>

      <UploadForm />
    </div>
  );
}
