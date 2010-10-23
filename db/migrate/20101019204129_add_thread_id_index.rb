class AddThreadIdIndex < ActiveRecord::Migration
  def self.up
      add_index :posts, :thread_id
  end

  def self.down
  end
end
