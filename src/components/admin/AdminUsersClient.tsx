"use client";

import {
  Eye,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import Header from "@/components/layout/Header";
import { formatPrice } from "@/lib/utils";
import AdminEmptyState from "@/components/admin/ui/AdminEmptyState";
import AdminLoadingSkeleton from "@/components/admin/ui/AdminLoadingSkeleton";
import AdminPageHeader from "@/components/admin/ui/AdminPageHeader";
import AdminPagination from "@/components/admin/ui/AdminPagination";
import AdminPrimaryButton from "@/components/admin/ui/AdminPrimaryButton";
import AdminSearchBar from "@/components/admin/ui/AdminSearchBar";
import AdminStatusBadge from "@/components/admin/ui/AdminStatusBadge";
import { useAccount } from "@/hooks/useAccount";
import {
  getAdminCustomer,
  getAdminCustomerAddresses,
  getAdminCustomerOrders,
  getAdminCustomers,
  updateAdminCustomerStatus,
  type AdminCustomer,
} from "@/services/adminCustomers.service";

type UserStatus = "Active" | "Blocked";
type UserRole = "Customer";
type UserFilter = "All" | "Active" | "Blocked" | "New Users";

type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  registeredAt: string;
  totalOrders: number;
  totalSpend: number;
  status: UserStatus;
  role: UserRole;
  address: string;
  latestOrderDate: string | null;
};

const filters: UserFilter[] = [
  "All",
  "Active",
  "Blocked",
  "New Users",
];

const pageSize = 4;

function toAdminUser(customer: AdminCustomer): AdminUser {
  return {
    id: customer.id,
    fullName: customer.fullName,
    email: customer.email,
    phone: customer.phone,
    registeredAt: customer.registeredAt,
    totalOrders: customer.orderCount,
    totalSpend: customer.totalSpend,
    status: customer.status,
    role: "Customer",
    address: "",
    latestOrderDate: customer.latestOrderDate,
  };
}

function formatAddress(addresses: Awaited<ReturnType<typeof getAdminCustomerAddresses>>) {
  const address = addresses[0];

  if (!address) return "No saved address";

  return [
    address.addressLine1,
    address.addressLine2,
    address.landmark,
    address.city,
    address.state,
    address.postalCode,
  ].filter(Boolean).join(", ");
}

export default function AdminUsersClient() {
  const { hydrated: accountHydrated, session } = useAccount();
  const accessToken = session?.accessToken;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<UserFilter>("All");
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const loadUsers = useCallback(async () => {
    if (!accessToken) {
      setUsers([]);
      setTotalPages(1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await getAdminCustomers(accessToken, {
        page,
        limit: pageSize,
        search: query,
        status: filter === "Active" || filter === "Blocked" ? filter : undefined,
      });
      setUsers(result.customers.map(toAdminUser));
      setTotalPages(Math.max(1, result.pagination.totalPages));
    } catch (error) {
      setUsers([]);
      setTotalPages(1);
      setMessage(error instanceof Error ? error.message : "Customers could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, filter, page, query]);

  useEffect(() => {
    if (!accountHydrated) return;

    void loadUsers();
  }, [accountHydrated, loadUsers]);

  const changeFilter = (nextFilter: UserFilter) => {
    setFilter(nextFilter);
    setPage(1);
  };

  const toggleUserStatus = async (user: AdminUser) => {
    const nextStatus: UserStatus =
      user.status === "Active" ? "Blocked" : "Active";

    if (!accessToken) return;

    try {
      await updateAdminCustomerStatus(accessToken, user.id, nextStatus);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: nextStatus } : item));
      setSelectedUser((current) => current?.id === user.id ? { ...current, status: nextStatus } : current);
      setMessage(`${user.fullName} is ${nextStatus.toLowerCase()}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Customer status could not be updated.");
    }
  };

  const viewUser = async (user: AdminUser) => {
    setSelectedUser(user);

    if (!accessToken) return;

    try {
      const [customer, addresses, orders] = await Promise.all([
        getAdminCustomer(accessToken, user.id),
        getAdminCustomerAddresses(accessToken, user.id),
        getAdminCustomerOrders(accessToken, user.id),
      ]);
      const nextUser = {
        ...toAdminUser(customer),
        address: formatAddress(addresses),
        totalOrders: orders.summary.totalOrders,
        totalSpend: orders.summary.totalSpend,
        latestOrderDate: orders.summary.latestOrderDate,
      };
      setSelectedUser((current) => current?.id === user.id ? nextUser : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Customer details could not be loaded.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        <Header />
        <Container className="py-6">
          <AdminLoadingSkeleton variant="page" className="h-[720px]" />
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />

      <main>
        <Container className="py-4 sm:py-8">
          <AdminPageHeader
            title="Users management"
            description="Review customer accounts and access status"
            action={
              <AdminPrimaryButton
                icon={<Plus size={15} />}
                onClick={() =>
                  setMessage("User creation will be connected to the approved backend.")
                }
              >
                Add user
              </AdminPrimaryButton>
            }
          />

          {message && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-bold text-[var(--success)]">
              <ShieldCheck size={16} />
              {message}
            </div>
          )}

          <section className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <AdminSearchBar
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Search name, email or phone"
              />

              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeFilter(item)}
                    className={`h-9 rounded-lg px-3 text-[10px] font-black transition ${
                      filter === item
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface-soft)] text-[var(--text-muted)]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {users.length === 0 ? (
            <AdminEmptyState
              title="No matching users"
              description="Try another search or account status filter."
              icon={UserRound}
              className="mt-5"
            />
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onView={() => void viewUser(user)}
                  onEdit={() =>
                    setMessage("User editing will be connected to the approved backend.")
                  }
                  onToggleStatus={() => void toggleUserStatus(user)}
                  onDelete={() => setMessage("Customer deletion is not supported by the current backend.")}
                />
              ))}
            </div>
          )}

          {users.length > 0 && (
            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => current + 1)}
              className="mt-6"
            />
          )}
        </Container>
      </main>

      {selectedUser && (
        <UserDetailDrawer
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onToggleStatus={() => void toggleUserStatus(selectedUser)}
          onDelete={() => setMessage("Customer deletion is not supported by the current backend.")}
        />
      )}
    </div>
  );
}

function UserCard({
  user,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  user: AdminUser;
  onView: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-[24px] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="flex items-start gap-3">
        <ProfilePlaceholder name={user.fullName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black text-[var(--text-primary)]">
                {user.fullName}
              </h2>
              <p className="mt-1 truncate text-[10px] text-[var(--text-muted)]">
                Joined {formatDate(user.registeredAt)}
              </p>
            </div>
            <AdminStatusBadge
              label={user.status}
              tone={user.status === "Active" ? "success" : "danger"}
              className="text-[9px]"
            />
          </div>
          <RoleBadge role={user.role} />
        </div>
      </div>

      <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
        <p className="flex items-center gap-2"><Mail size={13} />{user.email}</p>
        <p className="flex items-center gap-2"><Phone size={13} />+91 {user.phone}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 divide-x divide-[var(--border)] rounded-xl bg-[var(--surface-soft)]">
        <UserMetric label="Orders" value={String(user.totalOrders)} />
        <UserMetric label="Total spend" value={formatPrice(user.totalSpend)} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <ActionButton label="View" icon={<Eye size={14} />} onClick={onView} />
        <ActionButton label="Edit" icon={<Pencil size={14} />} onClick={onEdit} />
        <ActionButton label={user.status === "Active" ? "Block" : "Unblock"} icon={<LockKeyhole size={14} />} onClick={onToggleStatus} />
        <ActionButton label="Delete" icon={<Trash2 size={14} />} onClick={onDelete} danger />
      </div>
    </article>
  );
}

function UserDetailDrawer({
  user,
  onClose,
  onToggleStatus,
  onDelete,
}: {
  user: AdminUser;
  onClose: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/35 p-3 sm:p-5">
      <aside className="flex h-full w-full max-w-md flex-col overflow-y-auto rounded-[28px] bg-white shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between border-b border-[var(--border)] p-5">
          <div className="flex items-center gap-3">
            <ProfilePlaceholder name={user.fullName} />
            <div>
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                {user.fullName}
              </h2>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close user detail" className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-[var(--text-muted)]"><X size={17} /></button>
        </div>

        <div className="space-y-5 p-5">
          <DetailSection title="Personal Information">
            <DetailRow icon={<Mail size={14} />} label="Email" value={user.email} />
            <DetailRow icon={<Phone size={14} />} label="Phone" value={`+91 ${user.phone}`} />
            <DetailRow icon={<UserRound size={14} />} label="Registered" value={formatDate(user.registeredAt)} />
          </DetailSection>
          <DetailSection title="Address">
            <DetailRow icon={<MapPin size={14} />} label="Primary address" value={user.address} />
          </DetailSection>
          <DetailSection title="Order Summary">
            <DetailRow icon={<ShoppingBag size={14} />} label="Total orders" value={String(user.totalOrders)} />
            <DetailRow icon={<ShoppingBag size={14} />} label="Total spend" value={formatPrice(user.totalSpend)} />
          </DetailSection>
          <DetailSection title="Account Status">
            <DetailRow icon={<ShieldCheck size={14} />} label="Status" value={user.status} />
            <DetailRow icon={<ShieldCheck size={14} />} label="Role" value={user.role} />
          </DetailSection>
        </div>

        <div className="mt-auto space-y-3 border-t border-[var(--border)] p-5">
          <button type="button" onClick={onToggleStatus} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] text-xs font-black text-[var(--text-secondary)]"><LockKeyhole size={15} />{user.status === "Active" ? "Block account" : "Unblock account"}</button>
          <button type="button" onClick={onDelete} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-50 text-xs font-black text-[var(--danger)]"><Trash2 size={15} />Delete Account</button>
        </div>
      </aside>
    </div>
  );
}

function ProfilePlaceholder({ name }: { name: string }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-light)] text-xs font-black text-[var(--primary)]">{initials}</span>;
}

function RoleBadge({ role }: { role: UserRole }) {
  return <span className="mt-2 inline-flex rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[9px] font-black text-[var(--text-muted)]">{role}</span>;
}

function UserMetric({ label, value }: { label: string; value: string }) {
  return <div className="p-3 text-center"><p className="text-sm font-black text-[var(--text-primary)]">{value}</p><p className="mt-1 text-[9px] text-[var(--text-muted)]">{label}</p></div>;
}

function ActionButton({ label, icon, onClick, danger = false }: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" onClick={onClick} className={`flex h-9 items-center justify-center gap-1 rounded-lg text-[9px] font-black ${danger ? "bg-red-50 text-[var(--danger)]" : "bg-[var(--surface-soft)] text-[var(--text-secondary)]"}`}>{icon}{label}</button>;
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h3 className="text-[10px] font-black uppercase tracking-[0.1em] text-[var(--primary)]">{title}</h3><div className="mt-3 space-y-3 rounded-2xl bg-[var(--surface-soft)] p-4">{children}</div></section>;
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 text-[var(--text-muted)]">{icon}</span><div className="min-w-0"><p className="text-[9px] font-bold text-[var(--text-muted)]">{label}</p><p className="mt-1 break-words text-xs font-bold text-[var(--text-primary)]">{value}</p></div></div>;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
