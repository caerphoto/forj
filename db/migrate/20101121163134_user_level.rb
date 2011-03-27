class UserLevel < ActiveRecord::Migration
  def self.up
      remove_column :users, :admin
      # User's rank - a more fine-grained approach than "admin or not".
      # Rank 0 is an ordinary user, rank 1 is Moderator, and rank 2 is Admin.
      # Of course, site admins are free to modify this arrangement
      add_column :users, :rank, :integer, :default => 0
  end

  def self.down
      remove_column :users, :rank
      add_column :users, :admin, :boolean, :default => 0
  end
end
