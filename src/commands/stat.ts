/**
 * @author     Martin Høgh <mh@mapcentia.com>
 * @copyright  2013-2024 MapCentia ApS
 * @license    http://www.gnu.org/licenses/#AGPL  GNU AFFERO GENERAL PUBLIC LICENSE 3
 *
 */

import {Command, Flags} from '@oclif/core'
import ora from 'ora'
import {simpletable} from '../util/simpletable'
import get from '../util/get-response'
import make from '../util/make-request'

export default class Stat extends Command {
  static description = 'Get usage statistics.'
  static flags = {
    help: Flags.help({char: 'h'}),
  }
  async run() {
   // const {flags} = await this.parse(Stat)
    const spinner = ora('Collecting statistics').start()
    let data!: any // definite assignment: we assign it in try or throw

    try {

      const response = await make('4', 'stats', 'GET')
      data = await get(response, 200)
      spinner.succeed('done')
      this.log('')
    } catch (err) {
      spinner.fail('failed')
      throw err
    } finally {
      if (spinner.isSpinning) spinner.stop()
    }
    //console.log(data)
    type tables = {
      [key: string]: any
    }
    type table = {
      table_name: string;
      schema_name: string;
      total_size: string;
      total_size_bytes: string;
      table_size: string;
      table_size_bytes: string;
      indices_size: string;
      indices_size_bytes: string;
      row_count: number;

    }
    const rows: object[] = []
    const tables: tables = {name: {}, schema:{}, total_size: {}, indices_size: {}, row_count: {}}
    for (const c in data.tables) {
      const v: table = data.tables[c]
      rows.push({
        name: v.table_name,
        schema: v.schema_name,
        total_size: v.total_size,
        indices_size: v.indices_size,
        row_count: v.row_count,
      })
    }
    this.log('Number of tables: ' + data.number_of_tables )
    this.log('Total size of all tables: ' + data.total_size )
    simpletable(rows, tables, {
      printLine: this.log.bind(this)
    })
  }
}
