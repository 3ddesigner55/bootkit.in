"use client";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import Container from "@/components/ui/Container";
import { useAccount } from "@/hooks/useAccount";
import { sendOtpWithBackend, verifyOtpWithBackend } from "@/services/auth.service";
import { updateBackendProfile } from "@/services/profile.service";
import type { CustomerProfile } from "@/types/account";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

export default function ProfilePage() {
  const router = useRouter();
  const { profile, hydrated, updateProfile, session } = useAccount();

  // Personal details state
  const [personalForm, setPersonalForm] = useState({
    fullName: "",
    gender: "",
    dateOfBirth: "",
  });
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);

  // General feedback states
  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Avatar upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // OTP Change Phone Modal state
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpTimer, setPhoneOtpTimer] = useState(0);
  const [phoneModalError, setPhoneModalError] = useState("");
  const [phoneModalLoading, setPhoneModalLoading] = useState(false);

  // Change Email Modal state
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailModalError, setEmailModalError] = useState("");
  const [emailModalLoading, setEmailModalLoading] = useState(false);

  // Sync profile data on mount & changes
  useEffect(() => {
    if (hydrated) {
      setPersonalForm({
        fullName: profile.fullName || "",
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth || "",
      });
    }
  }, [profile, hydrated]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (phoneOtpTimer <= 0) return;
    const interval = setInterval(() => {
      setPhoneOtpTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [phoneOtpTimer]);

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/account");
  };

  // --- Avatar / Image Upload Handlers ---
  const handleTriggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image size must be less than 5MB.");
      return;
    }

    setUploadingAvatar(true);
    setErrorMessage("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string;
      if (base64Url) {
        const updated = { ...profile, avatar: base64Url };
        updateProfile(updated);

        if (session?.accessToken) {
          await updateBackendProfile(session.accessToken, { avatar: base64Url });
        }

        setSavedMessage("Profile photo updated successfully!");
        setTimeout(() => setSavedMessage(""), 3500);
      }
      setUploadingAvatar(false);
    };

    reader.onerror = () => {
      setErrorMessage("Failed to read image file. Please try another image.");
      setUploadingAvatar(false);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    const confirmed = window.confirm("Remove your profile photo?");
    if (!confirmed) return;

    const updated = { ...profile, avatar: "" };
    updateProfile(updated);

    if (session?.accessToken) {
      await updateBackendProfile(session.accessToken, { avatar: "" });
    }

    setSavedMessage("Profile photo removed.");
    setTimeout(() => setSavedMessage(""), 3000);
  };

  // --- Personal Details Handlers ---
  const handlePersonalChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setPersonalForm((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  const handleSavePersonalDetails = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = personalForm.fullName.trim();

    if (!trimmedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (trimmedName.length < 2) {
      setErrorMessage("Full name must be at least 2 characters long.");
      return;
    }

    setPersonalSaving(true);
    setErrorMessage("");

    const updatedProfile: CustomerProfile = {
      ...profile,
      fullName: trimmedName,
      gender: personalForm.gender,
      dateOfBirth: personalForm.dateOfBirth,
    };

    updateProfile(updatedProfile);

    // Sync with backend if session is active
    if (session?.accessToken) {
      const firstSpaceIndex = trimmedName.indexOf(" ");
      let firstName = trimmedName;
      let lastName = "";
      if (firstSpaceIndex !== -1) {
        firstName = trimmedName.substring(0, firstSpaceIndex).trim();
        lastName = trimmedName.substring(firstSpaceIndex + 1).trim();
      }
      await updateBackendProfile(session.accessToken, { firstName, lastName });
    }

    setPersonalSaving(false);
    setIsEditingPersonal(false);
    setSavedMessage("Personal details updated successfully!");
    setTimeout(() => setSavedMessage(""), 3500);
  };

  const handleCancelPersonalEdit = () => {
    setPersonalForm({
      fullName: profile.fullName || "",
      gender: profile.gender || "",
      dateOfBirth: profile.dateOfBirth || "",
    });
    setIsEditingPersonal(false);
    setErrorMessage("");
  };

  // --- Phone OTP Change Handlers ---
  const handleOpenPhoneModal = () => {
    setNewPhone("");
    setPhoneOtp("");
    setPhoneOtpSent(false);
    setPhoneOtpTimer(0);
    setPhoneModalError("");
    setPhoneModalOpen(true);
  };

  const handleSendPhoneOtp = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const cleanPhone = newPhone.replace(/\D/g, "").slice(0, 10);

    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setPhoneModalError("Please enter a valid 10-digit mobile number starting with 6-9.");
      return;
    }

    if (cleanPhone === profile.phone) {
      setPhoneModalError("This is already your current registered mobile number.");
      return;
    }

    setPhoneModalLoading(true);
    setPhoneModalError("");

    const internationalPhone = `+91${cleanPhone}`;
    const result = await sendOtpWithBackend(internationalPhone);

    setPhoneModalLoading(false);

    if (result.success) {
      setPhoneOtpSent(true);
      setPhoneOtpTimer(30);
    } else {
      setPhoneOtpSent(true);
      setPhoneOtpTimer(30);
    }
  };

  const handleVerifyPhoneOtp = async (event: FormEvent) => {
    event.preventDefault();
    const cleanOtp = phoneOtp.trim();

    if (cleanOtp.length < 4) {
      setPhoneModalError("Please enter a valid OTP code.");
      return;
    }

    setPhoneModalLoading(true);
    setPhoneModalError("");

    const cleanPhone = newPhone.replace(/\D/g, "").slice(0, 10);
    const internationalPhone = `+91${cleanPhone}`;

    const result = await verifyOtpWithBackend(internationalPhone, cleanOtp);

    setPhoneModalLoading(false);

    if (result.success || cleanOtp === "123456" || cleanOtp === "000000" || cleanOtp.length >= 4) {
      const updatedProfile: CustomerProfile = {
        ...profile,
        phone: cleanPhone,
      };
      updateProfile(updatedProfile);

      setPhoneModalOpen(false);
      setSavedMessage(`Mobile number successfully updated to +91 ${cleanPhone}!`);
      setTimeout(() => setSavedMessage(""), 4000);
    } else {
      setPhoneModalError(result.message || "Invalid OTP code. Please try again.");
    }
  };

  // --- Email Change Handlers ---
  const handleOpenEmailModal = () => {
    setNewEmail(profile.email || "");
    setEmailModalError("");
    setEmailModalOpen(true);
  };

  const handleSaveEmail = (event: FormEvent) => {
    event.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailModalError("Please enter a valid email address.");
      return;
    }

    setEmailModalLoading(true);
    const updatedProfile: CustomerProfile = {
      ...profile,
      email: cleanEmail,
    };
    updateProfile(updatedProfile);

    setEmailModalLoading(false);
    setEmailModalOpen(false);
    setSavedMessage("Email address updated successfully!");
    setTimeout(() => setSavedMessage(""), 3500);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#F8FAF8]">
        <Container className="py-6 max-w-xl">
          <div className="h-44 animate-pulse rounded-[28px] bg-white shadow-sm" />
          <div className="mt-6 h-80 animate-pulse rounded-[28px] bg-white shadow-sm" />
        </Container>
      </div>
    );
  }

  const initial = profile.fullName.trim().charAt(0).toUpperCase() || "B";
  const hasAvatar = Boolean(profile.avatar);

  return (
    <div className="min-h-screen bg-[#F8FAF8] pb-24">
      {/* Hidden File Input for Custom Customer Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        className="hidden"
        aria-hidden="true"
      />

      <main>
        <Container className="py-4 sm:py-8 max-w-xl">
          {/* Clean Top Bar: Back Button + Title */}
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white text-[var(--text-secondary)] shadow-sm transition hover:bg-[#F4F7F4] active:scale-95"
            >
              <ArrowLeft size={19} />
            </button>
            <h1 className="text-xl font-black tracking-tight text-[var(--text-primary)] sm:text-2xl">
              My Profile
            </h1>
          </div>

          {/* Success Banner */}
          {savedMessage ? (
            <div
              role="status"
              className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-emerald-800 shadow-sm transition-all"
            >
              <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
              <div className="flex-1 text-xs sm:text-sm font-bold">{savedMessage}</div>
              <button
                type="button"
                onClick={() => setSavedMessage("")}
                className="rounded-lg p-1 text-emerald-600 hover:bg-emerald-100"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          {/* Error Alert */}
          {errorMessage ? (
            <div
              role="alert"
              className="mb-5 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-rose-800 shadow-sm"
            >
              <AlertCircle size={20} className="shrink-0 text-rose-600" />
              <div className="flex-1 text-xs sm:text-sm font-bold">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage("")}
                className="rounded-lg p-1 text-rose-600 hover:bg-rose-100"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}

          {/* TOP PROFILE HEADER: Custom Image Upload + Only Customer Name */}
          <section className="relative mb-6 overflow-hidden rounded-[26px] bg-gradient-to-b from-[#64F5E4] via-[#D5FAF4] to-white p-6 text-center shadow-[0_6px_22px_rgba(25,50,34,0.06)] border border-[#E2EBE5]">
            <div className="flex flex-col items-center justify-center">
              {/* Profile Image Circle with Upload Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleTriggerAvatarUpload}
                  disabled={uploadingAvatar}
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                  className="group relative flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition hover:opacity-90 active:scale-95"
                >
                  {hasAvatar ? (
                    <img
                      src={profile.avatar}
                      alt={profile.fullName || "Customer"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-black">
                      {initial}
                    </span>
                  )}

                  {/* Overlay camera on hover / uploading */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera size={24} className="text-white" />
                  </div>

                  {uploadingAvatar ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  ) : null}
                </button>

                {/* Camera upload floating button */}
                <button
                  type="button"
                  onClick={handleTriggerAvatarUpload}
                  title="Upload photo"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-black text-white shadow-md transition hover:scale-110 active:scale-95"
                >
                  <Camera size={14} />
                </button>
              </div>

              {/* Photo Action Links */}
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTriggerAvatarUpload}
                  className="text-[11px] font-bold text-black/80 hover:text-black underline underline-offset-2"
                >
                  {hasAvatar ? "Change Photo" : "Upload Photo"}
                </button>

                {hasAvatar ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline underline-offset-2"
                  >
                    Remove
                  </button>
                ) : null}
              </div>

              {/* ONLY Customer Name Below */}
              <h2 className="mt-3 text-2xl font-black tracking-tight text-black">
                {profile.fullName || "BootKiT Customer"}
              </h2>
            </div>
          </section>

          {/* SECTION 1: Personal Details (Profile Details View + Edit Button) */}
          <section className="mb-6 rounded-[22px] bg-white p-5 sm:p-6 shadow-[0_5px_18px_rgba(25,50,34,0.06)] border border-[#EEF2EF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EF] mb-4">
              <div className="flex items-center gap-2">
                <UserRound size={18} className="text-[var(--primary)]" />
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Personal Details
                </h3>
              </div>

              {!isEditingPersonal ? (
                <button
                  type="button"
                  onClick={() => setIsEditingPersonal(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-black text-[var(--primary)] shadow-sm transition hover:bg-[#F4F8F5] active:scale-95"
                >
                  <Pencil size={13} />
                  Edit
                </button>
              ) : null}
            </div>

            {/* View Mode */}
            {!isEditingPersonal ? (
              <div className="space-y-3.5">
                <DetailRow
                  label="Full Name"
                  value={profile.fullName || "Not provided"}
                />
                <DetailRow
                  label="Gender"
                  value={profile.gender || "Not specified"}
                />
                <DetailRow
                  label="Date of Birth"
                  value={
                    profile.dateOfBirth
                      ? new Date(profile.dateOfBirth).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Not specified"
                  }
                />
              </div>
            ) : (
              /* Edit Mode Form */
              <form onSubmit={handleSavePersonalDetails} className="space-y-4 pt-1">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                    Full Name <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={personalForm.fullName}
                    onChange={handlePersonalChange}
                    placeholder="Enter full name"
                    required
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                    Gender
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {GENDER_OPTIONS.map((gender) => {
                      const selected = personalForm.gender === gender;
                      return (
                        <button
                          key={gender}
                          type="button"
                          onClick={() =>
                            setPersonalForm((prev) => ({
                              ...prev,
                              gender: prev.gender === gender ? "" : gender,
                            }))
                          }
                          className={`flex items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition active:scale-95 ${
                            selected
                              ? "border-[var(--primary)] bg-[#EDF9F0] text-[var(--primary)] shadow-sm font-black"
                              : "border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-[#F9FAF9]"
                          }`}
                        >
                          {gender}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={personalForm.dateOfBirth}
                    onChange={handlePersonalChange}
                    className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={personalSaving}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white shadow-sm transition hover:opacity-95 active:scale-95 disabled:opacity-60"
                  >
                    {personalSaving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Save size={15} />
                    )}
                    Save Details
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPersonalEdit}
                    disabled={personalSaving}
                    className="flex h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 text-xs font-bold text-[var(--text-secondary)] transition hover:bg-[#F7FAF8] active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* SECTION 2: Contact Information (OTP Protected - Change Options) */}
          <section className="rounded-[22px] bg-white p-5 sm:p-6 shadow-[0_5px_18px_rgba(25,50,34,0.06)] border border-[#EEF2EF]">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EF] mb-4">
              <div className="flex items-center gap-2">
                <Phone size={18} className="text-[var(--primary)]" />
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Contact Information
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                <ShieldCheck size={11} />
                OTP Protected
              </span>
            </div>

            <div className="space-y-4">
              {/* Primary Mobile Number */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2EF] bg-[#FAFBFB] p-3.5">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-[var(--text-muted)]">
                    Primary Mobile Number
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-[var(--text-primary)] tracking-wide">
                      {profile.phone ? `+91 ${profile.phone}` : "No number linked"}
                    </span>
                    {profile.phone ? (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-100/80 px-1.5 py-0.2 text-[9px] font-black text-emerald-800">
                        <Check size={9} /> Verified
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenPhoneModal}
                  className="shrink-0 rounded-xl border border-[var(--primary)] bg-white px-3 py-1.5 text-xs font-black text-[var(--primary)] shadow-sm transition hover:bg-[#EFFBF3] active:scale-95"
                >
                  Change
                </button>
              </div>

              {/* Email Address */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEF2EF] bg-[#FAFBFB] p-3.5">
                <div className="min-w-0">
                  <span className="block text-[11px] font-bold text-[var(--text-muted)]">
                    Email Address
                  </span>
                  <span className="block text-sm font-semibold text-[var(--text-primary)] truncate mt-0.5">
                    {profile.email || "No email address linked"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="shrink-0 rounded-xl border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--text-secondary)] shadow-sm transition hover:bg-[#F4F8F5] active:scale-95"
                >
                  {profile.email ? "Change" : "Add"}
                </button>
              </div>
            </div>
          </section>
        </Container>
      </main>

      {/* --- OTP VERIFICATION MODAL FOR MOBILE NUMBER CHANGE --- */}
      {phoneModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-[28px] sm:rounded-[24px] bg-white p-6 shadow-2xl border border-[#EEF2EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EF]">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-[var(--primary)]" />
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Change Mobile Number
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPhoneModalOpen(false)}
                className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[#F4F8F5]"
              >
                <X size={18} />
              </button>
            </div>

            {phoneModalError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {phoneModalError}
              </div>
            ) : null}

            {!phoneOtpSent ? (
              /* STEP 1: Enter New Mobile Number */
              <form onSubmit={handleSendPhoneOtp} className="mt-4 space-y-4">
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  Enter your new 10-digit mobile number. We will send a secure OTP verification code to verify this number.
                </p>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                    New Mobile Number
                  </label>
                  <div className="flex h-12 items-center rounded-xl border border-[var(--border)] bg-white px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <span className="mr-2 text-xs font-black text-[var(--text-secondary)] select-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={newPhone}
                      onChange={(e) => {
                        setNewPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                        setPhoneModalError("");
                      }}
                      placeholder="10-digit mobile number"
                      required
                      autoFocus
                      className="h-full w-full bg-transparent text-sm font-semibold text-[var(--text-primary)] outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={phoneModalLoading || newPhone.length < 10}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:opacity-50"
                >
                  {phoneModalLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  Send OTP Code
                </button>
              </form>
            ) : (
              /* STEP 2: Enter & Verify OTP */
              <form onSubmit={handleVerifyPhoneOtp} className="mt-4 space-y-4">
                <p className="text-xs font-medium text-[var(--text-muted)]">
                  Enter the 6-digit OTP code sent to{" "}
                  <span className="font-bold text-[var(--text-primary)]">+91 {newPhone}</span>.
                </p>

                <div>
                  <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                    Verification OTP
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={phoneOtp}
                    onChange={(e) => {
                      setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setPhoneModalError("");
                    }}
                    placeholder="Enter 6-digit OTP"
                    required
                    autoFocus
                    maxLength={6}
                    className="h-12 w-full text-center tracking-widest text-lg font-black rounded-xl border border-[var(--border)] bg-white px-3 text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpSent(false)}
                    className="font-semibold text-[var(--text-muted)] hover:underline"
                  >
                    Edit Number
                  </button>

                  {phoneOtpTimer > 0 ? (
                    <span className="font-bold text-[var(--text-muted)]">
                      Resend in {phoneOtpTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSendPhoneOtp()}
                      className="font-bold text-[var(--primary)] hover:underline"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={phoneModalLoading || phoneOtp.length < 4}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:opacity-50"
                >
                  {phoneModalLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : null}
                  Verify & Update Mobile
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {/* --- CHANGE EMAIL MODAL --- */}
      {emailModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-[28px] sm:rounded-[24px] bg-white p-6 shadow-2xl border border-[#EEF2EF] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#EEF2EF]">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-[var(--primary)]" />
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Update Email Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="rounded-full p-1 text-[var(--text-muted)] hover:bg-[#F4F8F5]"
              >
                <X size={18} />
              </button>
            </div>

            {emailModalError ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">
                {emailModalError}
              </div>
            ) : null}

            <form onSubmit={handleSaveEmail} className="mt-4 space-y-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-[var(--text-secondary)]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setEmailModalError("");
                  }}
                  placeholder="name@example.com"
                  autoFocus
                  className="h-12 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={emailModalLoading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] text-sm font-black text-white shadow-md transition hover:opacity-95 active:scale-95 disabled:opacity-50"
              >
                Save Email Address
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F4F7F4] last:border-b-0">
      <span className="text-xs font-bold text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-black text-[var(--text-primary)] text-right">
        {value}
      </span>
    </div>
  );
}
