class CreatePosts < ActiveRecord::Migration
  def self.up
    create_table :posts do |t|
      t.integer :user
      t.integer :thread_id
      t.integer :reply_to_index
      t.string :content
      t.integer :post_index

      t.timestamps
    end
  end

  def self.down
    drop_table :posts
  end
end
