<script setup lang="ts">
definePageMeta({ layout: "dashboard" });

import { computed, reactive, ref, watch } from "vue";

const { data, refresh, pending } = await useFetch("/api/config");

const providers = computed(() => data.value?.providers ?? []);
const providerOptions = computed(() => providers.value.map((p: any) => ({ label: p.display_name || p.id, value: p.id })));

const modelForm = reactive({
  provider_id: "",
  name: "",
  supports_images: false,
  per_minute: "",
  per_hour: "",
  per_day: "",
  per_month: "",
  tokens_per_minute: "",
  tokens_per_hour: "",
  tokens_per_day: "",
  tokens_per_month: "",
});

const selectedProvider = ref("");
const editingModelId = ref<number | null>(null);
const providerModels = reactive<Record<string, { pending: boolean; error: string | null; data: any[]; tried?: boolean }>>({});

const fetchProviderModels = async (providerId: string, opts?: { skipIfFetched?: boolean }) => {
  if (!providerId) return;
  const provider = providers.value.find((p: any) => p.id === providerId);
  if (!provider?.base_url) return;

  if (!providerModels[providerId]) {
    providerModels[providerId] = { pending: false, error: null, data: [], tried: false };
  }

  if (opts?.skipIfFetched && providerModels[providerId].tried) return;
  if (providerModels[providerId].pending) return;

  providerModels[providerId].pending = true;
  providerModels[providerId].error = null;
  providerModels[providerId].tried = true;

  try {
    const url = `${provider.base_url.replace(/\/+$/, "")}/models`;
    const res = await $fetch<any>(url, {
      headers: provider.api_key ? { Authorization: `Bearer ${provider.api_key}` } : undefined,
    });
    const list = Array.isArray(res?.data) ? res.data : res?.models ?? [];
    providerModels[providerId].data = list;
  } catch (err: any) {
    providerModels[providerId].error = err?.data?.statusMessage || err?.data?.message || err?.message || "Failed to fetch models";
  } finally {
    providerModels[providerId].pending = false;
  }
};

watch(
  providers,
  (list) => {
    if (!selectedProvider.value && list?.length === 1) {
      selectedProvider.value = list[0].id;
    }
  },
  { immediate: true }
);

watch(
  selectedProvider,
  (id) => {
    modelForm.provider_id = id;
    if (id) fetchProviderModels(id, { skipIfFetched: true });
  },
  { immediate: true }
);

const useSuggestion = (name: string) => {
  modelForm.name = name;
};

const toFormNumber = (value: any) => (value === null || value === undefined ? "" : String(value));

const resetForm = () => {
  modelForm.provider_id = "";
  modelForm.name = "";
  modelForm.supports_images = false;
  modelForm.per_minute = "";
  modelForm.per_hour = "";
  modelForm.per_day = "";
  modelForm.per_month = "";
  modelForm.tokens_per_minute = "";
  modelForm.tokens_per_hour = "";
  modelForm.tokens_per_day = "";
  modelForm.tokens_per_month = "";
  selectedProvider.value = "";
  editingModelId.value = null;
};

const editModel = (row: any) => {
  editingModelId.value = row?.id ?? null;
  selectedProvider.value = row?.provider_id ?? "";
  modelForm.provider_id = row?.provider_id ?? "";
  modelForm.name = row?.name ?? "";
  modelForm.supports_images = Boolean(row?.supports_images);
  modelForm.per_minute = toFormNumber(row?.per_minute);
  modelForm.per_hour = toFormNumber(row?.per_hour);
  modelForm.per_day = toFormNumber(row?.per_day);
  modelForm.per_month = toFormNumber(row?.per_month);
  modelForm.tokens_per_minute = toFormNumber(row?.tokens_per_minute);
  modelForm.tokens_per_hour = toFormNumber(row?.tokens_per_hour);
  modelForm.tokens_per_day = toFormNumber(row?.tokens_per_day);
  modelForm.tokens_per_month = toFormNumber(row?.tokens_per_month);
};

const submitModel = async () => {
  await $fetch("/api/models", { method: "POST", body: modelForm });
  await refresh();
  resetForm();
};

const deleteModel = async (id: number) => {
  if (!id) return;
  await $fetch(`/api/models/${id}`, { method: "DELETE" });
  await refresh();
  if (editingModelId.value === id) resetForm();
};
</script>

<template>
  <UContainer class="py-10 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-slate-500">Catalog</p>
        <h1 class="text-2xl font-semibold text-slate-900">Models</h1>
      </div>
      <UButton color="neutral" variant="ghost" icon="ph:arrows-clockwise" :loading="pending" @click="refresh">Refresh</UButton>
    </div>

    <UCard class="border-purple-100 bg-white">
      <div class="grid gap-6 lg:grid-cols-[420px,1fr]">
        <div class="space-y-4">
          <UForm :state="modelForm" @submit.prevent="submitModel" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <UFormField label="Provider" name="provider_id" required>
                <USelect v-model="selectedProvider" :items="providerOptions" placeholder="Select provider" :disabled="Boolean(editingModelId)" />
              </UFormField>
              <UFormField label="Name" name="name" required>
                <UInput v-model="modelForm.name" placeholder="gpt-4o" :disabled="Boolean(editingModelId)" />
              </UFormField>
            </div>

            <UAlert
              v-if="editingModelId"
              color="primary"
              variant="subtle"
              title="Editing model"
              :description="`Updating limits/capabilities for ${modelForm.provider_id}/${modelForm.name} (#${editingModelId})`"
            />

            <div class="rounded-lg border border-purple-100 bg-white p-3">
              <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <UCheckbox v-model="modelForm.supports_images" />
                <span>Supports image inputs</span>
              </label>
              <p class="mt-1 text-xs text-slate-500">When a conversation includes images, routing only selects models with this enabled.</p>
            </div>

            <div class="rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-sm text-slate-700" v-if="selectedProvider">
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <UIcon name="ph:stack" class="h-4 w-4 text-purple-600" />
                  <span class="font-medium">Provider models</span>
                </div>
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="ph:arrow-clockwise"
                  :loading="providerModels[selectedProvider]?.pending"
                  @click="fetchProviderModels(selectedProvider)">
                  Refresh
                </UButton>
              </div>

              <div v-if="providerModels[selectedProvider]?.pending" class="flex items-center gap-2 text-purple-600 text-xs">
                <UIcon name="ph:circle-notch" class="h-4 w-4 animate-spin" /> Fetching models…
              </div>
              <div v-else-if="providerModels[selectedProvider]?.error" class="text-xs text-red-600">
                {{ providerModels[selectedProvider]?.error }}
              </div>
              <div v-else-if="providerModels[selectedProvider]?.data?.length" class="flex flex-wrap gap-2">
                <UBadge
                  v-for="m in providerModels[selectedProvider].data"
                  :key="m.id || m.name"
                  color="neutral"
                  variant="soft"
                  class="cursor-pointer"
                  @click="useSuggestion(m.id || m.name)"
                >
                  {{ m.id || m.name }}
                </UBadge>
              </div>
              <div v-else class="text-xs text-slate-500">No models fetched yet.</div>
            </div>

            <div class="rounded-lg border border-purple-100 bg-purple-50/40 p-3 space-y-3">
              <p class="text-xs font-semibold text-slate-700">Request caps (requests)</p>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Per minute" name="per_minute">
                  <UInput v-model="modelForm.per_minute" type="number" placeholder="e.g. 60" />
                </UFormField>
                <UFormField label="Per hour" name="per_hour">
                  <UInput v-model="modelForm.per_hour" type="number" placeholder="e.g. 1000" />
                </UFormField>
                <UFormField label="Per day" name="per_day">
                  <UInput v-model="modelForm.per_day" type="number" placeholder="e.g. 20000" />
                </UFormField>
                <UFormField label="Per month" name="per_month">
                  <UInput v-model="modelForm.per_month" type="number" placeholder="e.g. 400000" />
                </UFormField>
              </div>
            </div>

            <div class="rounded-lg border border-purple-100 bg-purple-50/40 p-3 space-y-3">
              <p class="text-xs font-semibold text-slate-700">Token caps (tokens)</p>
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Per minute" name="tokens_per_minute">
                  <UInput v-model="modelForm.tokens_per_minute" type="number" placeholder="e.g. 20000" />
                </UFormField>
                <UFormField label="Per hour" name="tokens_per_hour">
                  <UInput v-model="modelForm.tokens_per_hour" type="number" placeholder="e.g. 500000" />
                </UFormField>
                <UFormField label="Per day" name="tokens_per_day">
                  <UInput v-model="modelForm.tokens_per_day" type="number" placeholder="e.g. 2000000" />
                </UFormField>
                <UFormField label="Per month" name="tokens_per_month">
                  <UInput v-model="modelForm.tokens_per_month" type="number" placeholder="e.g. 50000000" />
                </UFormField>
              </div>
            </div>
            <div class="flex justify-end">
              <div class="flex items-center gap-2">
                <UButton v-if="editingModelId" color="neutral" variant="ghost" icon="ph:x" @click="resetForm">Cancel</UButton>
                <UButton type="submit" color="primary" icon="ph:floppy-disk">
                  {{ editingModelId ? 'Update Model' : 'Save Model' }}
                </UButton>
              </div>
            </div>
          </UForm>
        </div>
        <div>
          <UTable
            :data="data?.models ?? []"
            :columns="[
              { id: 'id', accessorKey: 'id', header: '#' },
              { id: 'provider_id', accessorKey: 'provider_id', header: 'Provider' },
              { id: 'name', accessorKey: 'name', header: 'Name' },
              { id: 'supports_images', accessorKey: 'supports_images', header: 'Images' },
              { id: 'limits', accessorKey: 'limits', header: 'Req limits' },
              { id: 'token_limits', accessorKey: 'token_limits', header: 'Token limits' },
              { id: 'actions', accessorKey: 'actions', header: 'Actions' },
            ]"
            class="overflow-hidden rounded-xl border border-purple-100"
          >
            <template #supports_images-cell="{ row }">
              <UBadge :color="row.original.supports_images ? 'primary' : 'neutral'" variant="subtle">
                {{ row.original.supports_images ? 'Yes' : 'No' }}
              </UBadge>
            </template>
            <template #limits-cell="{ row }">
              <span class="font-mono text-xs">
                {{ row.original.per_minute ?? '-' }} / {{ row.original.per_hour ?? '-' }} / {{ row.original.per_day ?? '-' }} / {{ row.original.per_month ?? '-' }}
              </span>
            </template>
            <template #token_limits-cell="{ row }">
              <span class="font-mono text-xs">
                {{ row.original.tokens_per_minute ?? '-' }} / {{ row.original.tokens_per_hour ?? '-' }} / {{ row.original.tokens_per_day ?? '-' }} / {{ row.original.tokens_per_month ?? '-' }}
              </span>
            </template>
            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton size="xs" color="neutral" variant="ghost" icon="ph:pencil-simple" @click="editModel(row.original)">
                  Edit
                </UButton>
                <UButton size="xs" color="red" variant="ghost" icon="ph:trash" @click="deleteModel(row.original.id)">
                  Delete
                </UButton>
              </div>
            </template>
          </UTable>
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
