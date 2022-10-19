<template>
  <div>
    <div class="v-data-table-toolbar my-3 d-flex align-center">
      <v-spacer></v-spacer>
      <v-menu
        v-if="$attrs['column-toggler'] !== false"
        bottom
        left
        :close-on-content-click="false"
        transition="scale-transition"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn class="mr-2" color="primary" dark v-bind="attrs" v-on="on">
            <v-icon v-text="'mdi-table-headers-eye'"></v-icon>
          </v-btn>
        </template>

        <v-list dense style="max-height: 300px" class="overflow-y-auto">
          <v-list-item
            @click="setColumnVisibility(-1)"
            :disabled="allColumnsIsVisible"
          >
            <v-list-item-action class="ma-0 mr-4">
              <v-simple-checkbox
                color="primary"
                :value="allColumnsIsVisible"
                @click="setColumnVisibility(-1)"
              ></v-simple-checkbox>
            </v-list-item-action>
            <v-list-item-title v-html="'All'"></v-list-item-title>
          </v-list-item>
          <v-divider class="my-2"></v-divider>
          <v-list-item
            v-for="(header, i) in localHeaders"
            :key="i"
            @click.stop="setColumnVisibility(header.value)"
          >
            <v-list-item-action class="ma-0 mr-4">
              <v-simple-checkbox
                @click="setColumnVisibility(header.value)"
                color="primary"
                :value="!header?.hidden"
              ></v-simple-checkbox>
            </v-list-item-action>
            <v-list-item-title v-html="header.text"></v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <v-menu
        v-if="$attrs.hasOwnProperty('export') && $attrs?.export !== false"
        bottom
        left
        transition="scale-transition"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn class="mr-2" color="primary" dark v-bind="attrs" v-on="on">
            <v-icon v-text="'mdi-microsoft-excel'"></v-icon>
          </v-btn>
        </template>
        <v-list dense>
          <v-list-item @click="exportCSV">
            <v-icon v-text="'mdi-table-large'" left></v-icon>
            <v-list-item-title
              v-text="exportParams.text_csv"
            ></v-list-item-title>
          </v-list-item>

          <v-list-item @click="exportMSExcel">
            <v-icon v-text="'mdi-file-excel'" left></v-icon>
            <v-list-item-title
              v-text="exportParams.text_excel"
            ></v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
      <slot name="top-add"></slot>
    </div>
    <div v-if="tableColumns.length === 0 && $attrs.loading">
      <v-progress-linear indeterminate color="primary"></v-progress-linear>
      <v-skeleton-loader
        ref="skeleton"
        :loading="$attrs.loading"
        transition="scale-transition"
        type="table"
      ></v-skeleton-loader>
    </div>

    <v-data-table
      :ref="uniq_ref"
      :id="`${uniq_ref}`"
      v-if="tableColumns.length"
      :headers="tableColumns"
      :items="filteredData"
      v-bind="$attrs"
      v-on="$listeners"
      :class="[elevationClass]"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, 100, -1],
      }"
      v-sortable-table="{ onEnd: updateTable }"
      :key="anIncreasingNumber"
      @update:options="updateOptionsHandler"
    >
      <template
        v-for="(header, i) in tableColumns"
        v-slot:[`header.${header.value}`]="{}"
      >
        <div :key="`header_${header.value}`">
          <v-hover v-slot="{ hover }">
            <div>
              <div style="position: absolute; top: 10px; left: 0">
                <v-btn
                  class="mx-2"
                  icon
                  :color="header.fixed ? 'primary' : ''"
                  x-small
                  @click.stop="setFixedModel(header.value)"
                >
                  <!-- :disabled="!fixedColumnsArr.includes(i-1) && i!=0" -->
                  <v-icon v-if="header.fixed" v-text="'mdi-pin'"></v-icon>
                  <v-icon
                    v-else-if="!header.fixed && hover"
                    v-text="'mdi-pin-outline'"
                  ></v-icon>
                </v-btn>
              </div>
              <div
                class="v-data-table-th__title px-8"
                v-html="header.text"
              ></div>
            </div>
          </v-hover>
          <v-text-field
            v-if="
              !header.hasOwnProperty('filterControl') ||
              header?.filterControl != 'select'
            "
            :key="i"
            v-model.trim="multiSearch[header.value]"
            class="v-data-table-th__filter pa-0 mt-2"
            type="text"
            hide-details
            solo
            dense
            @click.stop
            :disabled="
              header.hasOwnProperty('filterControl') &&
              header?.filterControl == false
            "
            clearable
            autocomplete="null"
          >
          </v-text-field>
          <v-autocomplete
            v-else-if="header?.filterControl == 'select'"
            :items="getFilterSelectItems(header.value)"
            v-model="multiSearch[header.value]"
            class="v-data-table-th__filter filter-select pa-0 mt-2"
            hide-details
            solo
            dense
            :clearable="multiSearch[header.value] != ''"
            @click.stop
          >
            <template v-slot:selection="{ item }">
              <span v-html="item"></span>
            </template>
            <template v-slot:item="{ item, on, attrs }">
              <v-list-item
                v-bind="attrs"
                v-on="on"
                :value="item"
                :disabled="multiSearch[header.value] == item"
              >
                <span v-html="item.length ? item : 'All'"></span>
              </v-list-item>
            </template>
          </v-autocomplete>
        </div>
      </template>
      <template v-for="(index, name) in $scopedSlots" v-slot:[name]="data">
        <slot :name="name" v-bind="data"></slot>
      </template>
    </v-data-table>
  </div>
</template>

<script>
  import Sortable from 'sortablejs';
  import { saveDataFromJS } from '@/helpers/export';
  import { sortableWatchClass, bodyObserver } from '@/helpers/observers';
  // Add back the sortHandle class if it gets stripped away by external code

  export default {
    name: 'v-data-table-custom',
    props: {
      headers: {
        type: Array,
        required: true,
        default: () => [],
      },
      items: {
        type: Array,
        required: true,
        default: () => [],
      },
      update: {
        type: Number,
        required: true,
      },
    },
    data: () => ({
      uniq_ref: `table_${Date.now()}_${Math.random().toString().substring(2)}`,
      multiSearch: {},
      localHeaders: [],
      exportParams: {
        text_excel: 'export excel',
        text_csv: 'export csv',
        filename: '',
      },
      anIncreasingNumber: 1,
    }),
    computed: {
      tableColumns() {
        return this.localHeaders
          .map((th) => {
            if (th?.title) {
              th.text = th.title;
            }
            if (th?.field) {
              th.value = th.field;
            }
            const className = th?.class || '';
            return {
              ...th,
              class: className + ' v-data-table-header__th pa-2',
            };
          })
          .filter((th) => !th.hidden);
      },
      allColumnsIsVisible() {
        return (
          this.tableColumns.filter((th) => !th.hidden).length ==
          this.headers.length
        );
      },
      visibleColumns() {
        return this.tableColumns.filter((th) => !th.hidden) || [];
      },
      elevationClass() {
        return this.$attrs?.elevation
          ? `elevation-${this.$attrs['elevation']}`
          : '';
      },

      filteredData() {
        if (this.multiSearch) {
          return [...this.items].filter((item) => {
            return Object.entries(this.multiSearch).every(([key, value]) => {
              if (value === null) {
                value = '';
              }
              if (value.includes('|') && !value.includes('!')) {
                let el = value.split('|');
                return el.some((elem) =>
                  (item[key] || '')
                    .toString()
                    .toUpperCase()
                    .startsWith(elem.toString().toUpperCase())
                );
              }
              if (value.substring(0, 1) === '!' && !value.includes('|')) {
                let el = value.split('!');
                return el.some(
                  (elem) =>
                    !(item[key] || '')
                      .toString()
                      .toUpperCase()
                      .startsWith(elem.toString().toUpperCase())
                );
              }
              if (value.includes('|') && value.substring(0, 1) === '!') {
                let el = value.split('!')[1].split('|');
                return !el.some((elem) =>
                  (item[key] || '')
                    .toString()
                    .toUpperCase()
                    .startsWith(elem.toString().toUpperCase())
                );
              }
              if (value.substring(0, 1) === '>') {
                let el = value.split('>');
                if (item[key] !== ' ') {
                  return Number(item[key] || '') > el[1];
                }
              }
              if (
                value.substring(0, 1) === '<' &&
                !isNaN(parseFloat(value.substring(1)))
              ) {
                let el = value.split('<');
                if (item[key] !== ' ') {
                  return Number(item[key] || '') < el[1];
                }
              }
              if (value.substring(0, 1) === '=') {
                let el = value.split('=');
                return (
                  (item[key] || '').toString().toUpperCase() ===
                  el[1].toString().toUpperCase()
                );
              }
              return (item[key] || '')
                .toString()
                .toUpperCase()
                .includes(value.toString().toUpperCase());
            });
          });
        } else {
          return this.items;
        }
      },
      localFilename() {
        return this.filename || 'export';
      },
      exportData() {
        const columns_keys = this.localHeaders
          .filter((th) => !th.hidden)
          .map((th) => th.value);
        const rows = this.filteredData.map((row) =>
          columns_keys.map((col) => row[col])
        );
        const header = this.localHeaders
          .filter((th) => !th.hidden)
          .map((th) => th.text);
        rows.unshift(header);
        return rows;
      },
    },
    async created() {
      this.localHeaders = this.headers;
    },
    mounted() {
      this.tableBodyObserver();
    },
    methods: {
      updateOptionsHandler() {
        this.$nextTick(() => {
          this.setFixedColumns();
        });
      },
      async tableBodyObserver() {
        const target = document.querySelector(`#${this.uniq_ref}`);
        const isBody = await bodyObserver(target);
        if (isBody) {
          this.$nextTick(() => {
            this.setFixedColumns();
          });
        }
      },

      setFixedModel(value) {
        const index = this.localHeaders.findIndex((i) => i.value == value);
        this.$set(this.localHeaders, index, {
          ...this.localHeaders[index],
          fixed: !this.localHeaders[index]?.fixed,
        });
        this.$nextTick(() => {
          this.setFixedColumns();
        });
      },
      getFilterSelectItems(header) {
        const arr = this.items.map((item) => item[header]);
        const uniq = [...new Set(arr)].sort((a, b) => a.localeCompare(b));
        uniq.unshift('');
        return uniq;
      },
      setColumnVisibility(value) {
        if (value != -1) {
          const index = this.localHeaders.findIndex((th) => th.value == value);
          this.$set(this.localHeaders, index, {
            ...this.localHeaders[index],
            hidden: !this.localHeaders[index]?.hidden,
          });
        } else {
          this.localHeaders = this.localHeaders.map((th) => ({
            ...th,
            hidden: false,
          }));
        }
        this.$nextTick(() => {
          this.setFixedColumns();
        });
      },
      exportCSV() {
        saveDataFromJS(this.localFilename, this.exportData, 'csv');
      },
      exportMSExcel() {
        saveDataFromJS(this.localFilename, this.exportData, 'ms-excel');
      },
      async updateTable(event) {
        let result = await this.sortTheHeadersAndUpdateTheKey(event);
        if (result.length) {
          this.$nextTick(() => {
            this.setFixedColumns();
          });
        }
      },
      async sortTheHeadersAndUpdateTheKey(event) {
        const headersTmp = this.localHeaders.filter((th) => !th.hidden);
        const oldIndex = event.oldIndex;
        const newIndex = event.newIndex;
        let result = [];

        if (oldIndex == newIndex) {
          return result;
        }

        if (newIndex >= headersTmp.length) {
          let k = newIndex - headersTmp.length + 1;
          while (k--) {
            headersTmp.push(undefined);
          }
        }

        headersTmp.splice(newIndex, 0, headersTmp.splice(oldIndex, 1)[0]);
        const resultColumns = headersTmp.map((th) => th.value);

        this.localHeaders.map((th, index) => {
          if (th.hidden) {
            resultColumns.splice(index, 0, th.value);
          }
        });

        result = resultColumns.map((i) =>
          this.localHeaders.find((th) => th.value == i)
        );
        this.localHeaders = result;
        this.anIncreasingNumber += 1;

        return await result;
      },
      scrollToElement() {
        setTimeout(() => {
          let el = document.querySelector(`#${this.uniq_ref}`);
          if (el) {
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }, 500);
      },
      setFixedColumns() {
        let trHead =
          this.$refs[this.uniq_ref]?.$el.querySelectorAll('thead tr')[0];
        if (!trHead || !this.visibleColumns.length) {
          return;
        }

        const rows =
          this.$refs[this.uniq_ref]?.$el?.querySelectorAll('tbody tr');
        let widthArr = [];
        let widthSum = 0;

        trHead.querySelectorAll('th').forEach((th, index) => {
          widthArr[index] = this.visibleColumns[index]?.fixed
            ? widthSum
            : false;
          if (this.visibleColumns[index]?.fixed) {
            widthSum += th?.offsetWidth;
          }
          th.style.left = this.visibleColumns[index]?.fixed
            ? `${widthArr[index]}px`
            : 'auto';
          th.classList.toggle(
            'fixed-th',
            this.visibleColumns[index]?.fixed == true
          );
        });

        this.$nextTick(() => {
          rows.forEach((tr) => {
            tr.querySelectorAll('td').forEach((td, index) => {
              td.style.left = this.visibleColumns[index]?.fixed
                ? `${widthArr[index]}px`
                : 'auto';
              td.classList.toggle(
                'fixed-td',
                this.visibleColumns[index]?.fixed == true
              );
            });
          });
        });
      },
    },
    directives: {
      'sortable-table': {
        inserted: (el, binding) => {
          el.querySelectorAll('th').forEach((draggableEl) => {
            // Need a class watcher because sorting v-data-table rows asc/desc removes the sortHandle class
            sortableWatchClass(draggableEl, 'sortHandle');
            draggableEl.classList.add('sortHandle');
          });
          Sortable.create(
            el.querySelector('tr'),
            binding.value ? { ...binding.value, handle: '.sortHandle' } : {}
          );
        },
      },
    },
    watch: {
      update() {
        this.multiSearch = {};
        this.$nextTick(() => this.scrollToElement());
      },
      headers(newVal) {
        this.localHeaders = newVal;
      },
      visibleColumns(newVal, oldVal) {
        if (newVal.length !== oldVal.length) {
          this.$nextTick(() => {
            document
              .querySelectorAll('.v-data-table-th__filter.filter-select')
              .forEach((filterEl) => {
                filterEl.addEventListener('click', (e) => {
                  e.stopImmediatePropagation();
                });
              });
          });
        }
      },
    },
  };
</script>

<style>
  .v-data-table__wrapper .v-data-table-header .v-data-table-header__th {
    white-space: nowrap;
    background-color: #fafafa !important;
    vertical-align: bottom;
  }
  .v-data-table__wrapper
    .v-data-table-header
    .v-data-table-header__th
    .v-data-table-header__icon {
    position: absolute !important;
    top: 10px;
    right: 8px;
  }
  .v-data-table__wrapper
    .v-data-table-header
    .v-data-table-header__th
    .v-input--is-disabled
    input:hover,
  .v-data-table__wrapper
    .v-data-table-header
    .v-data-table-header__th
    .v-input--is-disabled
    .v-input__slot:hover {
    cursor: not-allowed !important;
  }
  .v-data-table__wrapper tbody tr {
    cursor: pointer;
  }

  table > tbody > tr > td.fixed-td,
  table > thead > tr > th.fixed-th {
    position: sticky !important;
    position: -webkit-sticky !important;
    left: 0;
    top: auto;
    background: white;
  }
  table > tbody > tr > td.fixed-td {
    z-index: 1 !important;
  }
  table > thead > tr > th.fixed-th {
    z-index: 3 !important;
  }
  table > tbody > tr.active > td.fixed-td {
    background: #f5f5f5;
  }

  table > tbody > tr:hover > td.fixed-td,
  table > tbody > tr.active:hover > td.fixed-td {
    background: #eee;
  }
</style>
