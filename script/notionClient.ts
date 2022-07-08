import { Client } from '@notionhq/client'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

export function insert(id: string, q: string, result: string, hash: string) {
  // notion.databases.query({
  //   database_id: process.env.NOTION_SCORE_DB ?? '',
  //   filter: {
  // 		property: "Name",
  //     Name: {
  //       title: [{ text: { content: 'sample' } }],
  //     },
  //   },
  // })
  notion.pages.create({
    parent: {
      database_id: process.env.NOTION_SCORE_DB ?? '',
    },
    properties: {
      Name: {
        title: [{ text: { content: id } }],
      },
      Result: {
        rich_text: [{ text: { content: result } }],
      },
      Q: {
        select: { name: q },
      },
      Hash: {
        rich_text: [{ text: { content: hash } }],
      },
    },
  })
}
