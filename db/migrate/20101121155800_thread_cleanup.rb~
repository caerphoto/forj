class ThreadCleanup < ActiveRecord::Migration
  def self.up
      # Remove unnecessary columns
      remove_column :msg_threads, :first_post_id
      remove_column :msg_threads, :post_count
      remove_column :msg_threads, :sticky
      remove_column :folders, :admin
      remove_column :folders, :public

      # Pinned threads appear at the top of the list regardless of whether
      # they're read or unread.
      add_column :msg_threads, :pinned, :boolean, :default => 0

      # Clearance required to see/post to folder
      # 0 = public
      # 1 = registered users only
      # 2 = admins only
      add_column :folders, :clearance, :integer, :default => 0

      # Works similar to :last_read but has only 3 values:
      # -1 = ignore thread
      # 0 = normal
      # 1 = interested
      # An example would be "1:-1,2:0,3:1"
      add_column :users, :interest, :text, :default => ""
  end

  def self.down
      remove_column :msg_threads, :pinned
      remove_column :folders, :clearance
  end
end
