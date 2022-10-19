<template>
  <v-app>
    <v-main>
      <v-container>
        <v-row>
          <v-col cols="12">
            <datatable-extended
              style="white-space: nowrap"
              :headers.sync="tableHeaders"
              :items="tableRows"
              :update="timestamp"
              dense
              item-key="id"
              fixed-header
              :height="440"
              elevation="4"
              :loading="loading"
              column-toggler
              export
            ></datatable-extended>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
  import DatatableExtended from './components/DatatableExtended';
  import { faker } from '@faker-js/faker';
  export default {
    name: 'App',

    components: {
      DatatableExtended,
    },

    data: () => ({
      tableHeaders: [
        { text: 'id', value: 'id' },
        { text: 'zip', value: 'zip' },
        { text: 'country', value: 'country', fixed: true },
        { text: 'city', value: 'city' },
        { text: 'address', value: 'address' },
        { text: 'name', value: 'name' },
        { text: 'position', value: 'position', filterControl: 'select' },
        { text: 'phone', value: 'phone' },
        { text: 'email', value: 'email' },
      ],
      tableRows: [],
      timestamp: Date.now(),
      loading: false,
    }),
    async mounted() {
      this.tableRows = await this.getFakeTableData(1000);
      this.timestamp = Date.now();
    },
    methods: {
      fakeUser() {
        return {
          id: faker.datatype.uuid(),
          zip: faker.address.buildingNumber(),
          country: faker.address.country(),
          city: faker.address.city(),
          address: faker.address.streetAddress(true),
          name: faker.name.fullName(),
          position: faker.name.jobType(),
          phone: faker.phone.number(),
          email: faker.internet.email(),
        };
      },
      async getFakeTableData(count) {
        return await [...new Array(count)].map(() => this.fakeUser());
      },
    },
  };
</script>
