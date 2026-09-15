"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { listCustomers } from "@/lib/pro/api";
import type { CustomerDetail } from "@/lib/pro/client";
import type { InvoiceParty } from "@/lib/tools/invoice-generator";

export function CustomerPicker({
  onSelect,
}: {
  onSelect: (party: InvoiceParty) => void;
}) {
  const { user, loading } = useAuth();
  const [customers, setCustomers] = useState<CustomerDetail[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }
    void listCustomers()
      .then((result) => setCustomers(result.customers))
      .catch(() => setCustomers([]));
  }, [user]);

  if (loading || !user || customers.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-line bg-panel p-3">
      <label htmlFor="saved-customer" className="text-sm font-medium">
        Saved customer
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Select
          id="saved-customer"
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
        >
          <option value="">Choose a customer</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.company ? ` — ${customer.company}` : ""}
            </option>
          ))}
        </Select>
        <Button
          disabled={!selectedId}
          onClick={() => {
            const customer = customers.find((item) => item.id === selectedId);
            if (!customer) {
              return;
            }
            onSelect({
              name: customer.name,
              company: customer.company,
              email: customer.email,
              phone: customer.phone,
              address: customer.address,
              website: "",
              taxId: "",
            });
          }}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
