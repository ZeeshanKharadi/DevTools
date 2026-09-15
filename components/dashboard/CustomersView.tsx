"use client";

import { useEffect, useState } from "react";
import { DashboardShell, RequireAuth, formatWhen } from "@/components/dashboard/DashboardShell";
import { Button } from "@/components/ui/Button";
import { Feedback } from "@/components/ui/Feedback";
import { Input } from "@/components/ui/Input";
import { createCustomer, deleteCustomer, listCustomers, updateCustomer } from "@/lib/pro/api";
import { ApiError } from "@/lib/pro/client";
import type { CustomerDetail } from "@/lib/pro/client";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
};

export function CustomersView() {
  const [items, setItems] = useState<CustomerDetail[] | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    void listCustomers()
      .then((result) => setItems(result.customers))
      .catch((caught) => {
        setError(caught instanceof ApiError ? caught.message : "Could not load customers.");
      });
  }, []);

  async function handleSave() {
    setPending(true);
    setError(null);
    try {
      if (editingId) {
        const result = await updateCustomer(editingId, form);
        setItems((current) =>
          (current ?? []).map((item) => (item.id === editingId ? result.customer : item)),
        );
        setSuccess("Customer updated.");
      } else {
        const result = await createCustomer(form);
        setItems((current) => [result.customer, ...(current ?? [])]);
        setSuccess("Customer saved.");
      }
      setForm(EMPTY);
      setEditingId(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not save customer.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this customer? Existing invoices keep their copied details.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await deleteCustomer(id);
      setItems((current) => (current ?? []).filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(EMPTY);
      }
      setSuccess("Customer deleted.");
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Could not delete.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <RequireAuth label="customers">
      <DashboardShell
        title="Customers"
        description="A simple directory you can apply while creating an invoice. This is not a CRM."
      >
        <form
          className="space-y-3 rounded-xl border border-line bg-panel p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSave();
          }}
        >
          <h2 className="text-lg font-semibold tracking-tight">
            {editingId ? "Edit customer" : "Add customer"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ["name", "Name"],
                ["company", "Company"],
                ["email", "Email"],
                ["phone", "Phone"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="space-y-1">
                <label htmlFor={`customer-${key}`} className="text-sm font-medium">
                  {label}
                </label>
                <Input
                  id={`customer-${key}`}
                  value={form[key]}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, [key]: event.target.value }))
                  }
                  required={key === "name"}
                />
              </div>
            ))}
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="customer-address" className="text-sm font-medium">
                Address
              </label>
              <Input
                id="customer-address"
                value={form.address}
                onChange={(event) =>
                  setForm((current) => ({ ...current, address: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" type="submit" disabled={pending || !form.name.trim()}>
              {pending ? "Saving…" : editingId ? "Save changes" : "Save customer"}
            </Button>
            {editingId ? (
              <Button
                onClick={() => {
                  setEditingId(null);
                  setForm(EMPTY);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
        {error ? (
          <Feedback tone="error" live>
            {error}
          </Feedback>
        ) : null}
        {success ? (
          <Feedback tone="success" live>
            {success}
          </Feedback>
        ) : null}
        {items === null && !error ? (
          <p className="text-sm text-muted">Loading customers…</p>
        ) : null}
        {items && items.length === 0 ? (
          <Feedback>No customers yet. Add one here, then select it on an invoice.</Feedback>
        ) : null}
        {items && items.length > 0 ? (
          <ul className="space-y-3">
            {items.map((customer) => (
              <li
                key={customer.id}
                className="flex flex-col gap-3 rounded-xl border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{customer.name}</p>
                  <p className="text-xs text-muted">
                    {[customer.company, customer.email, customer.phone]
                      .filter(Boolean)
                      .join(" · ") || "No extra details"}
                  </p>
                  <p className="text-xs text-muted">Updated {formatWhen(customer.updatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      setEditingId(customer.id);
                      setForm({
                        name: customer.name,
                        email: customer.email,
                        phone: customer.phone,
                        company: customer.company,
                        address: customer.address,
                      });
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={busyId === customer.id}
                    onClick={() => void handleDelete(customer.id)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </DashboardShell>
    </RequireAuth>
  );
}
