'use strict';

const SECTION2_TABLE = 'components_contacts_page_section2s';
const TEXT_COLUMN = 'text';

const isPostgresClient = (knex) => {
  const clientName = String(knex.client.config.client ?? '').toLowerCase();

  return clientName.includes('pg') || clientName.includes('postgres');
};

const hasSection2TextColumn = async (knex) => {
  const hasTable = await knex.schema.hasTable(SECTION2_TABLE);

  if (!hasTable) {
    return false;
  }

  return knex.schema.hasColumn(SECTION2_TABLE, TEXT_COLUMN);
};

module.exports = {
  async up(knex) {
    if (!isPostgresClient(knex)) {
      return;
    }

    const hasColumn = await hasSection2TextColumn(knex);

    if (!hasColumn) {
      return;
    }

    await knex.raw(
      'ALTER TABLE ?? ALTER COLUMN ?? TYPE text USING ??::text',
      [SECTION2_TABLE, TEXT_COLUMN, TEXT_COLUMN]
    );
  },

  async down() {
    // Do not convert back to varchar(255); that could truncate saved content.
  },
};
