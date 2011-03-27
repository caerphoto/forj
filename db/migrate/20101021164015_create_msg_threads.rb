class CreateMsgThreads < ActiveRecord::Migration
  def self.up
    create_table :msg_threads do |t|
      t.integer :post_count
      t.string :title
      t.integer :folder_id
      t.boolean :sticky
      t.integer :post_id

      t.timestamps
    end
  end

  def self.down
    drop_table :msg_threads
  end
end
