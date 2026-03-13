import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";

type CreateLogRequest = {
  title: string;
  description: string;
  observedAt: string;
  locationName: string;
  coverImageUrl: string | null;
  lat: number;
  lng: number;
  bortleScale: number | null;
  weatherCondition: string;
  seeingRating: number | null;
  isPublic: boolean;
};

export function NewObservationPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    description: "",
    observedAtLocal: "",
    locationName: "",
    coverImageUrl: "",
    lat: "",
    lng: "",
    bortleScale: "",
    weatherCondition: "",
    seeingRating: "",
    isPublic: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) {
    navigate("/login");
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      setForm((prev) => ({
        ...prev,
        [name]: target.checked,
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const observedAtDate = new Date(form.observedAtLocal);
      const now = new Date();
      if (observedAtDate.getTime() > now.getTime()) {
        setError("Observed at time cannot be in the future.");
        setSubmitting(false);
        return;
      }

      const payload: CreateLogRequest = {
        title: form.title,
        description: form.description,
        observedAt: observedAtDate.toISOString(),
        locationName: form.locationName,
        coverImageUrl: form.coverImageUrl.trim() || null,
        lat: Number(form.lat),
        lng: Number(form.lng),
        bortleScale: form.bortleScale ? Number(form.bortleScale) : null,
        weatherCondition: form.weatherCondition,
        seeingRating: form.seeingRating ? Number(form.seeingRating) : null,
        isPublic: form.isPublic,
      };

      await api.post("/api/logs", payload);

      navigate("/community");
    } catch {
      setError("Failed to create observation. Please check your input.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUploadCoverImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setUploadingImage(true);
    setError(null);
    try {
      const response = await api.post<{ url: string }>("/api/uploads/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((prev) => ({ ...prev, coverImageUrl: response.data.url }));
    } catch {
      setError("Failed to upload cover image.");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex justify-center">
      <div className="w-full max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">New observation</h1>
        <p className="text-sm text-slate-400 mb-4">
          Fields marked with <span className="text-sky-400">*</span> are required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1" htmlFor="title">
              Title <span className="text-sky-400" aria-hidden="true">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="observedAtLocal">
                Observed at <span className="text-sky-400" aria-hidden="true">*</span>
              </label>
              <input
                id="observedAtLocal"
                name="observedAtLocal"
                type="datetime-local"
                value={form.observedAtLocal}
                onChange={handleChange}
                required
                max={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="locationName">
                Location name
              </label>
              <input
                id="locationName"
                name="locationName"
                type="text"
                value={form.locationName}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="coverImageUrl">
              Cover image URL
            </label>
            <input
              id="coverImageUrl"
              name="coverImageUrl"
              type="url"
              value={form.coverImageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="mt-1 text-xs text-slate-400">You can paste a URL or upload an image below.</p>
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="coverImageUpload">
              Upload cover image
            </label>
            <input
              id="coverImageUpload"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                handleUploadCoverImage(file);
              }}
              className="w-full text-sm text-slate-300 file:mr-3 file:rounded-full file:border-0 file:bg-sky-400/25 file:px-3 file:py-1.5 file:text-sky-200"
            />
            {uploadingImage && <p className="mt-1 text-xs text-slate-400">Uploading image...</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="lat">
                Latitude <span className="text-sky-400" aria-hidden="true">*</span>
              </label>
              <input
                id="lat"
                name="lat"
                type="number"
                step="0.000001"
                min={-90}
                max={90}
                value={form.lat}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="lng">
                Longitude <span className="text-sky-400" aria-hidden="true">*</span>
              </label>
              <input
                id="lng"
                name="lng"
                type="number"
                step="0.000001"
                min={-180}
                max={180}
                value={form.lng}
                onChange={handleChange}
                required
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1" htmlFor="bortleScale">
                Bortle scale (1–9)
              </label>
              <input
                id="bortleScale"
                name="bortleScale"
                type="number"
                min={1}
                max={9}
                value={form.bortleScale}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Lower is darker sky. 1 = excellent dark site, 9 = bright inner-city sky.
              </p>
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="weatherCondition">
                Weather
              </label>
              <select
                id="weatherCondition"
                name="weatherCondition"
                value={form.weatherCondition}
                onChange={handleChange as unknown as React.ChangeEventHandler<HTMLSelectElement>}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select weather</option>
                <option value="Clear">Clear</option>
                <option value="Mostly clear">Mostly clear</option>
                <option value="Partly cloudy">Partly cloudy</option>
                <option value="Thin clouds">Thin clouds</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Fog">Fog</option>
                <option value="Haze">Haze</option>
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1" htmlFor="seeingRating">
                Seeing (1–5)
              </label>
              <input
                id="seeingRating"
                name="seeingRating"
                type="number"
                min={1}
                max={5}
                value={form.seeingRating}
                onChange={handleChange}
                className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Atmospheric steadiness. 1 = very unstable stars, 5 = steady sharp stars.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPublic"
              name="isPublic"
              type="checkbox"
              checked={form.isPublic}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500"
            />
            <label htmlFor="isPublic" className="text-sm">
              Make this observation public
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create observation"}
          </button>
        </form>
      </div>
    </div>
  );
}

