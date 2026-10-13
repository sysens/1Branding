'use strict';

// Merges the five identical SEO components (seo.landing-page, seo.about-page,
// seo.price-page, seo.one-guarantee-page, seo.contacts-page) into one
// shared.seo component. The SEO single type keeps its field names, so the API
// and GraphQL responses keep their shape.
//
// User migrations run before Strapi syncs the database schema: the old
// component tables still exist here and the new one does not. This creates
// the new table, copies every SEO entry the single type links to (all
// locales) and repoints the links. The schema sync that follows drops the old
// tables. Rows no entry links to are not visible anywhere and are not copied.

const LINK_TABLE = 'seos_cmps';
const TARGET = { uid: 'shared.seo', table: 'components_shared_seos' };
const SOURCES = [
  { uid: 'seo.landing-page', table: 'components_seo_landing_pages' },
  { uid: 'seo.about-page', table: 'components_seo_about_pages' },
  { uid: 'seo.price-page', table: 'components_seo_price_pages' },
  { uid: 'seo.one-guarantee-page', table: 'components_seo_one_guarantee_pages' },
  { uid: 'seo.contacts-page', table: 'components_seo_contacts_pages' },
];

// better-sqlite3 returns the new id, Postgres the requested columns.
const insertedId = (result) => (typeof result === 'object' ? result.id : result);

module.exports = {
  async up(knex) {
    // A new database has no tables yet; the schema sync creates shared.seo.
    if (!(await knex.schema.hasTable(LINK_TABLE))) {
      return;
    }

    if (!(await knex.schema.hasTable(TARGET.table))) {
      // The same columns Strapi creates for this component.
      await knex.schema.createTable(TARGET.table, (table) => {
        table.increments('id');
        table.string('title');
        table.text('description');
      });
    }

    const moved = {};
    let dropped = 0;

    for (const source of SOURCES) {
      const links = await knex(LINK_TABLE).where({ component_type: source.uid }).orderBy('id');
      if (!links.length) {
        continue;
      }
      const hasSource = await knex.schema.hasTable(source.table);

      for (const link of links) {
        const row = hasSource ? await knex(source.table).where({ id: link.cmp_id }).first() : undefined;

        if (!row) {
          // A link to a missing row already reads as empty. Repointing it
          // could attach it to an unrelated shared.seo row, so it goes.
          await knex(LINK_TABLE).where({ id: link.id }).del();
          dropped += 1;
          continue;
        }

        const [result] = await knex(TARGET.table).insert(
          { title: row.title, description: row.description },
          ['id']
        );
        await knex(LINK_TABLE)
          .where({ id: link.id })
          .update({ cmp_id: insertedId(result), component_type: TARGET.uid });
        moved[source.uid] = (moved[source.uid] ?? 0) + 1;
      }
    }

    const left = await knex(LINK_TABLE)
      .whereIn('component_type', SOURCES.map((source) => source.uid))
      .count({ count: '*' })
      .first();
    if (Number(left?.count ?? 0) !== 0) {
      throw new Error(`[merge-seo] ${left.count} SEO link(s) still point at an old component`);
    }

    console.info(
      `[merge-seo] moved ${JSON.stringify(moved)} into ${TARGET.uid}; dropped ${dropped} broken link(s)`
    );
  },

  async down() {
    // The schema sync drops the old tables right after up(); restore the
    // database backup taken before the deploy instead.
  },
};
