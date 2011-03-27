class UserlessThreads < ActiveRecord::Migration
  def self.up
      remove_column :msg_threads, :user_id
  end

  def self.down
  end
end
