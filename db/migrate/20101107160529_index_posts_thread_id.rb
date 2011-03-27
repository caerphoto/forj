class IndexPostsThreadId < ActiveRecord::Migration
  def self.up
      add_index :posts, [:user_id, :msg_thread_id]
  end

  def self.down
      remove_index :posts, :column => [:user_id, :msg_thread_id]
  end
end
